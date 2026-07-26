import json
import os
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource("dynamodb")
events_client = boto3.client("events")

ORDERS_TABLE = os.environ.get("ORDERS_TABLE_NAME", "Orders")
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE_NAME", "Products")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "default")

orders_table = dynamodb.Table(ORDERS_TABLE)
products_table = dynamodb.Table(PRODUCTS_TABLE)

CANCELLABLE_STATUSES = {"PENDING", "CONFIRMED"}


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        caller_id = claims["sub"]
        user_groups = claims.get("cognito:groups", "")

        is_admin = "admin" in user_groups or "operator" in user_groups

        path_params = event.get("pathParameters") or {}
        order_id = path_params.get("id")

        if not order_id:
            return _response(400, {"message": "OrderId es requerido"})

        if is_admin:
            response = orders_table.scan(FilterExpression=Attr("OrderId").eq(order_id))
            items = response.get("Items", [])
            while "LastEvaluatedKey" in response and not items:
                response = orders_table.scan(
                    FilterExpression=Attr("OrderId").eq(order_id),
                    ExclusiveStartKey=response["LastEvaluatedKey"]
                )
                items.extend(response.get("Items", []))
            
            if not items:
                return _response(404, {"message": "Pedido no encontrado"})
            order = items[0]
            customer_id = order["CustomerId"]
        else:
            customer_id = caller_id
            response = orders_table.get_item(
                Key={"CustomerId": customer_id, "OrderId": order_id}
            )
            order = response.get("Item")
            
            if not order:
                return _response(404, {"message": "Pedido no encontrado"})

            if order["CustomerId"] != caller_id:
                return _response(403, {"message": "No autorizado"})

        current_status = order.get("Status", "")

        if current_status not in CANCELLABLE_STATUSES:
            return _response(400, {
                "message": f"No se puede cancelar un pedido con estado '{current_status}'. Solo se permite cancelar pedidos en estado: {', '.join(sorted(CANCELLABLE_STATUSES))}"
            })

        order_items = order.get("Items", [])
        store_id = order.get("StoreId", "")

        now = datetime.utcnow().isoformat()

        result = orders_table.update_item(
            Key={"CustomerId": customer_id, "OrderId": order_id},
            UpdateExpression="SET #s = :cancelled, UpdatedAt = :now",
            ExpressionAttributeNames={"#s": "Status"},
            ExpressionAttributeValues={
                ":cancelled": "CANCELLED",
                ":now": now
            },
            ReturnValues="ALL_NEW"
        )

        updated_order = result.get("Attributes", {})

        try:
            events_client.put_events(Entries=[{
                "Source": "cloudshop.orders",
                "DetailType": "OrderCancelled",
                "Detail": json.dumps({
                    "OrderId": order_id,
                    "CustomerId": customer_id,
                    "PreviousStatus": current_status,
                    "NewStatus": "CANCELLED",
                    "CancelledAt": now,
                    "CancelledBy": caller_id
                }),
                "EventBusName": EVENT_BUS_NAME
            }])
        except Exception:
            pass

        return _response(200, {
            "message": "Pedido cancelado exitosamente",
            "order": updated_order
        })

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
