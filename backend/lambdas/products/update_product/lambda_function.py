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
            return _response(403, {"message": "No autorizado para actualizar productos"})

        path_params = event.get("pathParameters") or {}
        product_id = path_params.get("id")

        if not product_id:
            return _response(400, {"message": "ProductId es requerido"})

        body = json.loads(event.get("body", "{}"))
        store_id = body.get("StoreId", "").strip()

        if not store_id:
            return _response(400, {"message": "StoreId es requerido"})

        update_fields = []
        expression_attribute_values = {}
        expression_attribute_names = {}

        allowed_fields = ["Code", "Name", "Description", "Category", "Price", "Stock", "Status"]
        
        for field in allowed_fields:
            if field in body:
                val = body[field]
                if field == "Price":
                    val = Decimal(str(val))
                elif field == "Stock":
                    val = int(val)
                
                # Use expression attribute names to avoid reserved keyword conflicts (like Name, Status)
                attr_name = f"#{field}"
                attr_val = f":{field}"
                
                update_fields.append(f"{attr_name} = {attr_val}")
                expression_attribute_names[attr_name] = field
                expression_attribute_values[attr_val] = val

        if not update_fields:
            return _response(400, {"message": "No hay campos válidos para actualizar"})

        # Always update UpdatedAt
        now = datetime.utcnow().isoformat()
        update_fields.append("#UpdatedAt = :UpdatedAt")
        expression_attribute_names["#UpdatedAt"] = "UpdatedAt"
        expression_attribute_values[":UpdatedAt"] = now

        update_expression = "SET " + ", ".join(update_fields)

        try:
            response = products_table.update_item(
                Key={"StoreId": store_id, "ProductId": product_id},
                UpdateExpression=update_expression,
                ExpressionAttributeNames=expression_attribute_names,
                ExpressionAttributeValues=expression_attribute_values,
                ConditionExpression="attribute_exists(ProductId)",
                ReturnValues="ALL_NEW"
            )
            updated_product = response.get("Attributes")
            return _response(200, updated_product)
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
