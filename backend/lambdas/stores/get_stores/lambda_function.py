import base64
import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr


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

        if "admin" not in user_groups and "operator" not in user_groups:
            return _response(403, {"message": "No autorizado"})

        query_params = event.get("queryStringParameters") or {}
        limit = _parse_limit(query_params.get("limit"))
        next_token = query_params.get("next_token")

        scan_kwargs = {"Limit": limit}

        if next_token:
            try:
                decoded = json.loads(base64.b64decode(next_token).decode("utf-8"))
                scan_kwargs["ExclusiveStartKey"] = decoded
            except Exception:
                return _response(400, {"message": "next_token invalido"})

        if "admin" in user_groups:
            response = stores_table.scan(**scan_kwargs)
        else:
            scan_kwargs["FilterExpression"] = Attr("OwnerId").eq(caller_id)
            response = stores_table.scan(**scan_kwargs)

        items = response.get("Items", [])
        result = {
            "stores": items,
            "count": len(items)
        }

        if "LastEvaluatedKey" in response:
            result["next_token"] = base64.b64encode(
                json.dumps(response["LastEvaluatedKey"], cls=DecimalEncoder).encode("utf-8")
            ).decode("utf-8")

        return _response(200, result)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return _response(500, {"message": "Error interno del servidor"})


def _parse_limit(value):
    try:
        limit = int(value) if value is not None else 20
        if limit < 1 or limit > 100:
            return 20
        return limit
    except Exception:
        return 20


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
