import json
import os
from datetime import datetime
from decimal import Decimal

import boto3

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
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_groups = claims.get("cognito:groups", "")

        is_admin = "admin" in user_groups or "operator" in user_groups
        if not is_admin:
            return _response(403, {"message": "No autorizado para eliminar productos"})

        path_params = event.get("pathParameters") or {}
        product_id = path_params.get("id")

        if not product_id:
            return _response(400, {"message": "ProductId es requerido"})

        query_params = event.get("queryStringParameters") or {}
        store_id = query_params.get("store_id")

        if not store_id:
            return _response(400, {"message": "StoreId es requerido"})

        now = datetime.utcnow().isoformat()
        
        try:
            response = products_table.update_item(
                Key={"StoreId": store_id, "ProductId": product_id},
                UpdateExpression="SET #Status = :status, #UpdatedAt = :updated_at",
                ExpressionAttributeNames={
                    "#Status": "Status",
                    "#UpdatedAt": "UpdatedAt"
                },
                ExpressionAttributeValues={
                    ":status": "INACTIVE",
                    ":updated_at": now
                },
                ConditionExpression="attribute_exists(ProductId)",
                ReturnValues="ALL_NEW"
            )
            return _response(200, {"message": "Producto eliminado exitosamente (Soft Delete)"})
        except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
            return _response(404, {"message": "Producto no encontrado"})

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
