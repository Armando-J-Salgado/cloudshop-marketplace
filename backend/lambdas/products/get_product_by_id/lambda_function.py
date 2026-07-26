import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr

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
        path_params = event.get("pathParameters") or {}
        product_id = path_params.get("id")

        if not product_id:
            return _response(400, {"message": "ProductId es requerido"})

        query_params = event.get("queryStringParameters") or {}
        store_id = query_params.get("store_id")

        if store_id:
            response = products_table.get_item(
                Key={"StoreId": store_id, "ProductId": product_id}
            )
            product = response.get("Item")
        else:
            response = products_table.scan(FilterExpression=Attr("ProductId").eq(product_id))
            items = response.get("Items", [])
            while "LastEvaluatedKey" in response and not items:
                response = products_table.scan(
                    FilterExpression=Attr("ProductId").eq(product_id),
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )
                items.extend(response.get("Items", []))
            
            product = items[0] if items else None

        if not product:
            return _response(404, {"message": "Producto no encontrado"})

        return _response(200, product)

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
