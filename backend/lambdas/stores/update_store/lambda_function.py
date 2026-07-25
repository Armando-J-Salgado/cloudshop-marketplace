import json
import os
from datetime import datetime
from decimal import Decimal

import boto3


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
        caller_id = claims["sub"]
        user_groups = _normalize_groups(claims.get("cognito:groups", ""))

        path_params = event.get("pathParameters") or {}
        store_id = (path_params.get("id") or "").strip()

        if not store_id:
            return _response(400, {"message": "StoreId es requerido"})

        response = stores_table.get_item(Key={"StoreId": store_id})
        store = response.get("Item")

        if not store:
            return _response(404, {"message": "Tienda no encontrada"})

        if "admin" not in user_groups and "operator" not in user_groups:
            return _response(403, {"message": "No autorizado"})
        if "operator" in user_groups and store.get("OwnerId") != caller_id:
            return _response(403, {"message": "No autorizado"})

        body = json.loads(event.get("body") or "{}")
        editable_fields = ["Name", "Description", "Email", "Phone", "Address"]

        update_parts = []
        expression_attribute_names = {}
        expression_attribute_values = {}

        for index, field in enumerate(editable_fields):
            value = body.get(field)
            if value is None:
                continue
            if not isinstance(value, str) or not value.strip():
                return _response(400, {"message": f"{field} debe ser una cadena no vacia"})

            token_name = f"#f{index}"
            token_value = f":v{index}"
            update_parts.append(f"{token_name} = {token_value}")
            expression_attribute_names[token_name] = field
            expression_attribute_values[token_value] = value.strip()

        if not update_parts:
            return _response(400, {"message": "Debe enviar al menos un campo editable"})

        now = datetime.utcnow().isoformat()
        update_parts.append("UpdatedAt = :now")
        expression_attribute_values[":now"] = now

        result = stores_table.update_item(
            Key={"StoreId": store_id},
            UpdateExpression="SET " + ", ".join(update_parts),
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW"
        )

        updated_store = result.get("Attributes", {})

        return _response(200, {
            "message": "Tienda actualizada exitosamente",
            "store": updated_store
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
