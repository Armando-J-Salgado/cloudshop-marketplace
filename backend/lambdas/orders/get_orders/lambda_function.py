import json
import os
import base64
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")

ORDERS_TABLE = os.environ.get("ORDERS_TABLE_NAME", "Orders")
orders_table = dynamodb.Table(ORDERS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        customer_id = claims["sub"]
        user_groups = claims.get("cognito:groups", "")

        is_admin = "admin" in user_groups or "operator" in user_groups

        query_params = event.get("queryStringParameters") or {}
        limit = int(query_params.get("limit", "20"))
        next_token = query_params.get("next_token")

        if limit < 1 or limit > 100:
            limit = 20

        scan_kwargs = {}

        if next_token:
            try:
                decoded = json.loads(base64.b64decode(next_token).decode("utf-8"))
                scan_kwargs["ExclusiveStartKey"] = decoded
            except Exception:
                return _response(400, {"message": "next_token inválido"})

        if is_admin:
            filter_customer = query_params.get("customer_id")
            filter_store = query_params.get("store_id")

            if filter_customer:
                response = orders_table.query(
                    KeyConditionExpression=Key("CustomerId").eq(filter_customer),
                    Limit=limit,
                    ScanIndexForward=False,
                    **scan_kwargs
                )
            elif filter_store:
                scan_kwargs["FilterExpression"] = Key("StoreId").eq(filter_store)
                response = orders_table.scan(Limit=limit, **scan_kwargs)
            else:
                response = orders_table.scan(Limit=limit, **scan_kwargs)
        else:
            response = orders_table.query(
                KeyConditionExpression=Key("CustomerId").eq(customer_id),
                Limit=limit,
                ScanIndexForward=False,
                **scan_kwargs
            )

        items = response.get("Items", [])

        result = {"orders": items}

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
