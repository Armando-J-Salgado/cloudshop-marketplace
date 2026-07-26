import json
import os
from datetime import datetime
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")

CARTS_TABLE = os.environ.get("CARTS_TABLE_NAME", "Carts")
carts_table = dynamodb.Table(CARTS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        customer_id = claims["sub"]

        path_params = event.get("pathParameters") or {}
        cart_id = path_params.get("id")
        if cart_id and cart_id != customer_id:
            return _response(403, {"message": "No tienes acceso a este carrito"})

        product_id = (path_params.get("productId") or "").strip()

        body = json.loads(event.get("body", "{}"))
        quantity = body.get("Quantity", 1)

        if not product_id:
            return _response(400, {"message": "productId es requerido en la ruta"})

        if not isinstance(quantity, int) or quantity < 1:
            return _response(400, {"message": "Quantity debe ser un entero mayor a 0"})

        now = datetime.utcnow().isoformat()

        response = carts_table.get_item(Key={"ClientId": customer_id})
        cart = response.get("Item")

        if cart:
            items = cart.get("Items", [])

            existing_index = None
            for i, item in enumerate(items):
                if item["ProductId"] == product_id:
                    existing_index = i
                    break

            if existing_index is not None:
                items[existing_index]["Quantity"] = items[existing_index]["Quantity"] + quantity
            else:
                items.append({"ProductId": product_id, "Quantity": quantity})

            carts_table.update_item(
                Key={"ClientId": customer_id},
                UpdateExpression="SET #items = :items, UpdatedAt = :now",
                ExpressionAttributeNames={"#items": "Items"},
                ExpressionAttributeValues={":items": items, ":now": now}
            )
        else:
            items = [{"ProductId": product_id, "Quantity": quantity}]
            carts_table.put_item(Item={
                "ClientId": customer_id,
                "Items": items,
                "CreatedAt": now,
                "UpdatedAt": now
            })

        return _response(200, {
            "message": "Producto agregado al carrito",
            "cart": {"ClientId": customer_id, "Items": items}
        })

    except json.JSONDecodeError:
        return _response(400, {"message": "Body invalido: debe ser JSON"})
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
