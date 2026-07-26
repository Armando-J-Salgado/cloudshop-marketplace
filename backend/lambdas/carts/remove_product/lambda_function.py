import json
import os
import sys
from datetime import datetime
from decimal import Decimal

import boto3

# Add utils directory to path for importing event_emitter
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'utils'))
from event_emitter import emit_event

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

        body = json.loads(event.get("body", "{}"))
        product_id = body.get("ProductId", "").strip()

        if not product_id:
            return _response(400, {"message": "ProductId es requerido"})

        response = carts_table.get_item(Key={"CustomerId": customer_id})
        cart = response.get("Item")

        if not cart or not cart.get("Items"):
            return _response(404, {"message": "Carrito no encontrado o esta vacio"})

        items = cart["Items"]
        original_length = len(items)

        items = [item for item in items if item["ProductId"] != product_id]

        if len(items) == original_length:
            return _response(404, {"message": f"Producto {product_id} no encontrado en el carrito"})

        now = datetime.utcnow().isoformat()

        carts_table.update_item(
            Key={"CustomerId": customer_id},
            UpdateExpression="SET #items = :items, UpdatedAt = :now",
            ExpressionAttributeNames={"#items": "Items"},
            ExpressionAttributeValues={":items": items, ":now": now}
        )

        # Emit audit event
        emit_event(
            user_id=customer_id,
            action="REMOVE_PRODUCT_FROM_CART",
            result="SUCCESS",
            details={
                "CustomerId": customer_id,
                "ProductId": product_id
            }
        )

        return _response(200, {
            "message": "Producto eliminado del carrito",
            "cart": {"CustomerId": customer_id, "Items": items}
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
