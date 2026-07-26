import json
import os
import sys
from datetime import datetime
from decimal import Decimal

import boto3

# Add utils directory to path for importing event_emitter
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'utils'))
from event_emitter import emit_event


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
        user_groups = _normalize_groups(claims.get("cognito:groups", ""))
        user_id = claims.get("sub", "SYSTEM")

        if "admin" not in user_groups:
            return _response(403, {"message": "No autorizado"})

        path_params = event.get("pathParameters") or {}
        store_id = (path_params.get("id") or "").strip()

        if not store_id:
            return _response(400, {"message": "StoreId es requerido"})

        response = stores_table.get_item(Key={"StoreId": store_id})
        store = response.get("Item")

        if not store:
            return _response(404, {"message": "Tienda no encontrada"})

        now = datetime.utcnow().isoformat()

        result = stores_table.update_item(
            Key={"StoreId": store_id},
            UpdateExpression="SET #s = :inactive, UpdatedAt = :now",
            ExpressionAttributeNames={"#s": "Status"},
            ExpressionAttributeValues={
                ":inactive": "INACTIVE",
                ":now": now
            },
            ReturnValues="ALL_NEW"
        )

        updated_store = result.get("Attributes", {})

        # Emit audit event
        emit_event(
            user_id=user_id,
            action="DELETE_STORE",
            result="SUCCESS",
            details={
                "StoreId": store_id
            }
        )

        return _response(200, {
            "message": "Tienda desactivada exitosamente",
            "store": updated_store
        })

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
