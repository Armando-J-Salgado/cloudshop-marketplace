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

        path_params = event.get("pathParameters") or {}
        cart_id = path_params.get("id")
        if cart_id and cart_id != customer_id:
            return _response(403, {"message": "No tienes acceso a este carrito"})

        response = carts_table.get_item(Key={"ClientId": customer_id})
        cart = response.get("Item")

        if not cart:
            return _response(404, {"message": "Carrito no encontrado"})

        now = datetime.utcnow().isoformat()

        carts_table.update_item(
            Key={"ClientId": customer_id},
            UpdateExpression="SET #items = :empty, UpdatedAt = :now",
            ExpressionAttributeNames={"#items": "Items"},
            ExpressionAttributeValues={":empty": [], ":now": now}
        )

        # Emit audit event
        emit_event(
            user_id=customer_id,
            action="CLEAR_CART",
            result="SUCCESS",
            details={
                "ClientId": customer_id
            }
        )

        return _response(200, {
            "message": "Carrito vaciado exitosamente",
            "cart": {"ClientId": customer_id, "Items": []}
        })

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
