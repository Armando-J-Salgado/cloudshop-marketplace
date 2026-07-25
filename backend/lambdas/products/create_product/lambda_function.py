import json
import os
import uuid
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
            return _response(403, {"message": "No autorizado para crear productos"})

        body = json.loads(event.get("body", "{}"))
        store_id = body.get("StoreId", "").strip()
        
        if not store_id:
            return _response(400, {"message": "StoreId es requerido"})
            
        required_fields = ["Code", "Name", "Description", "Category", "Price", "Stock"]
        for field in required_fields:
            if field not in body:
                return _response(400, {"message": f"El campo {field} es requerido"})

        product_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        product = {
            "StoreId": store_id,
            "ProductId": product_id,
            "Code": body.get("Code"),
            "Name": body.get("Name"),
            "Description": body.get("Description"),
            "Category": body.get("Category"),
            "Price": Decimal(str(body.get("Price"))),
            "Stock": int(body.get("Stock")),
            "Status": "ACTIVE",
            "CreatedAt": now,
            "UpdatedAt": now
        }

        products_table.put_item(Item=product)

        return _response(201, product)

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
