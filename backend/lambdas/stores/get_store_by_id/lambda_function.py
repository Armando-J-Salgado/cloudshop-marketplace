import json
import os
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

        return _response(200, {"store": store})

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
