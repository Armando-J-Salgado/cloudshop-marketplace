import json
import os
import base64
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")

PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE_NAME", "Products")
products_table = dynamodb.Table(PRODUCTS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    try:
        query_params = event.get("queryStringParameters") or {}
        limit = int(query_params.get("limit", "20"))
        next_token = query_params.get("next_token")
        store_id = query_params.get("store_id")

        if limit < 1 or limit > 100:
            limit = 20

        scan_kwargs = {}

        if next_token:
            try:
                decoded = json.loads(base64.b64decode(next_token).decode("utf-8"))
                scan_kwargs["ExclusiveStartKey"] = decoded
            except Exception:
                return _response(400, {"message": "next_token inválido"})

        if store_id:
            response = products_table.query(
                KeyConditionExpression=Key("StoreId").eq(store_id),
                Limit=limit,
                **scan_kwargs
            )
        else:
            response = products_table.scan(Limit=limit, **scan_kwargs)

        items = response.get("Items", [])

        result = {"products": items}

        if "LastEvaluatedKey" in response:
            encoded = base64.b64encode(
                json.dumps(response["LastEvaluatedKey"], cls=DecimalEncoder).encode("utf-8")
            ).decode("utf-8")
            result["next_token"] = encoded

        return _response(200, result)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return _response(500, {"message": "Error interno del servidor"})


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
