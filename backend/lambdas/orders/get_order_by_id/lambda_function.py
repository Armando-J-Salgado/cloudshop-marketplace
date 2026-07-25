import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key, Attr

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

        path_params = event.get("pathParameters") or {}
        order_id = path_params.get("id")

        if not order_id:
            return _response(400, {"message": "OrderId es requerido"})

        if is_admin:
            response = orders_table.scan(
                FilterExpression=Attr("OrderId").eq(order_id),
                Limit=1
            )
            items = response.get("Items", [])
            if not items:
                return _response(404, {"message": "Pedido no encontrado"})
            order = items[0]
        else:
            response = orders_table.get_item(
                Key={"CustomerId": customer_id, "OrderId": order_id}
            )
            order = response.get("Item")
            if not order:
                return _response(404, {"message": "Pedido no encontrado"})

        return _response(200, order)

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
