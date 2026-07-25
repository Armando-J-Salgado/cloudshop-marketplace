import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")
events_client = boto3.client("events")

ORDERS_TABLE = os.environ.get("ORDERS_TABLE_NAME", "Orders")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "default")

orders_table = dynamodb.Table(ORDERS_TABLE)

VALID_STATUSES = {"CONFIRMED", "SHIPPED", "DELIVERED"}

ALLOWED_TRANSITIONS = {
    "PENDING": "CONFIRMED",
    "CONFIRMED": "SHIPPED",
    "SHIPPED": "DELIVERED"
}


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        user_groups = claims.get("cognito:groups", "")

        is_admin = "admin" in user_groups or "operator" in user_groups

        if not is_admin:
            return _response(403, {"message": "No autorizado. Solo admin u operator pueden actualizar estados"})

        path_params = event.get("pathParameters") or {}
        order_id = path_params.get("id")

        if not order_id:
            return _response(400, {"message": "OrderId es requerido"})

        body = json.loads(event.get("body", "{}"))
        customer_id = body.get("CustomerId", "").strip()
        new_status = body.get("Status", "").strip().upper()

        if not customer_id:
            return _response(400, {"message": "CustomerId es requerido en el body"})

        if not new_status:
            return _response(400, {"message": "Status es requerido en el body"})

        if new_status not in VALID_STATUSES:
            return _response(400, {
                "message": f"Status inválido. Valores permitidos: {', '.join(sorted(VALID_STATUSES))}"
            })

        response = orders_table.get_item(
            Key={"CustomerId": customer_id, "OrderId": order_id}
        )
        order = response.get("Item")

        if not order:
            return _response(404, {"message": "Pedido no encontrado"})

        current_status = order.get("Status", "")

        if current_status == "CANCELLED":
            return _response(400, {"message": "No se puede modificar un pedido cancelado"})

        if current_status == "DELIVERED":
            return _response(400, {"message": "No se puede modificar un pedido ya entregado"})

        expected_next = ALLOWED_TRANSITIONS.get(current_status)
        if new_status != expected_next:
            return _response(400, {
                "message": f"Transición inválida: {current_status} → {new_status}. Solo se permite: {current_status} → {expected_next}"
            })

        from datetime import datetime
        now = datetime.utcnow().isoformat()

        result = orders_table.update_item(
            Key={"CustomerId": customer_id, "OrderId": order_id},
            UpdateExpression="SET #s = :status, UpdatedAt = :now",
            ExpressionAttributeNames={"#s": "Status"},
            ExpressionAttributeValues={
                ":status": new_status,
                ":now": now
            },
            ReturnValues="ALL_NEW"
        )

        updated_order = result.get("Attributes", {})

        try:
            events_client.put_events(Entries=[{
                "Source": "cloudshop.orders",
                "DetailType": "OrderStatusChanged",
                "Detail": json.dumps({
                    "OrderId": order_id,
                    "CustomerId": customer_id,
                    "PreviousStatus": current_status,
                    "NewStatus": new_status,
                    "UpdatedAt": now
                }),
                "EventBusName": EVENT_BUS_NAME
            }])
        except Exception:
            pass

        return _response(200, updated_order)

    except json.JSONDecodeError:
        return _response(400, {"message": "Body inválido: debe ser JSON"})
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
