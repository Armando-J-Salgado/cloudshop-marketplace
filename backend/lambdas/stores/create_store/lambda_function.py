import json
import os
import sys
from datetime import datetime
from decimal import Decimal
from uuid import uuid4

import boto3

from utils.event_emitter import emit_event

dynamodb = boto3.resource("dynamodb")

STORES_TABLE = os.environ.get("STORES_TABLE_NAME", "Stores")
stores_table = dynamodb.Table(STORES_TABLE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        user_groups = claims.get("cognito:groups", "")
        user_id = claims.get("sub", "SYSTEM")

        if "admin" not in _normalize_groups(user_groups):
            return _response(403, {"message": "No autorizado"})

        body = json.loads(event.get("body") or "{}")

        name = (body.get("Name") or "").strip()
        description = (body.get("Description") or "").strip()
        owner_id = (body.get("OwnerId") or "").strip()
        email = (body.get("Email") or "").strip()
        phone = (body.get("Phone") or "").strip()
        address = (body.get("Address") or "").strip()

        if not all([name, description, owner_id, email, phone, address]):
            return _response(400, {"message": "Name, Description, OwnerId, Email, Phone y Address son requeridos"})

        now = datetime.utcnow().isoformat()
        store_id = str(uuid4())

        item = {
            "StoreId": store_id,
            "Name": name,
            "Description": description,
            "OwnerId": owner_id,
            "Email": email,
            "Phone": phone,
            "Address": address,
            "Status": "ACTIVE",
            "CreatedAt": now,
            "UpdatedAt": now
        }

        stores_table.put_item(Item=item)

        # Emit audit event
        emit_event(
            user_id=user_id,
            action="CREATE_STORE",
            result="SUCCESS",
            details={
                "StoreId": store_id,
                "Name": name,
                "OwnerId": owner_id
            }
        )

        return _response(201, {
            "message": "Tienda creada exitosamente",
            "store": item
        })

    except json.JSONDecodeError:
        return _response(400, {"message": "Body invalido: debe ser JSON"})
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return _response(500, {"message": "Error interno del servidor"})


def _normalize_groups(user_groups):
    if isinstance(user_groups, list):
        return {str(group).strip() for group in user_groups if str(group).strip()}
    if isinstance(user_groups, str):
        return {group.strip() for group in user_groups.split(",") if group.strip()}
    return set()


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PATCH,DELETE"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }
