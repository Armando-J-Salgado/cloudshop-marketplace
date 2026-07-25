import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource("dynamodb")
events_client = boto3.client("events")

ORDERS_TABLE = os.environ.get("ORDERS_TABLE_NAME", "Orders")
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE_NAME", "Products")
CARTS_TABLE = os.environ.get("CARTS_TABLE_NAME", "Carts")
EVENT_BUS_NAME = os.environ.get("EVENT_BUS_NAME", "default")

orders_table = dynamodb.Table(ORDERS_TABLE)
products_table = dynamodb.Table(PRODUCTS_TABLE)
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
        email = claims.get("email", "")

        body = json.loads(event.get("body", "{}"))
        store_id = body.get("StoreId", "").strip()

        if not store_id:
            return _response(400, {"message": "StoreId es requerido"})

        cart_response = carts_table.get_item(Key={"UserId": customer_id})
        cart = cart_response.get("Item")

        if not cart or not cart.get("Items"):
            return _response(400, {"message": "El carrito está vacío"})

        cart_items = cart["Items"]
        order_items = []
        total = Decimal("0")

        for cart_item in cart_items:
            product_id = cart_item["ProductId"]
            quantity = int(cart_item["Quantity"])

            product_response = products_table.get_item(Key={"StoreId": store_id, "ProductId": product_id})
            product = product_response.get("Item")

            if not product:
                return _response(400, {"message": f"Producto {product_id} no encontrado"})

            if product.get("Status") != "ACTIVE":
                return _response(400, {"message": f"Producto {product.get('Name', product_id)} no está disponible"})

            available_inventory = int(product.get("Stock", 0))
            if available_inventory < quantity:
                return _response(400, {
                    "message": f"Stock insuficiente para {product.get('Name', product_id)}. Disponible: {available_inventory}, solicitado: {quantity}"
                })

            price = Decimal(str(product["Price"]))
            order_items.append({
                "ProductId": product_id,
                "Name": product.get("Name", ""),
                "Price": price,
                "Quantity": quantity
            })
            total += price * quantity

        for item in order_items:
            products_table.update_item(
                Key={"StoreId": store_id, "ProductId": item["ProductId"]},
                UpdateExpression="ADD Stock :qty",
                ExpressionAttributeValues={":qty": -item["Quantity"]}
            )

        order_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()

        order = {
            "CustomerId": customer_id,
            "OrderId": order_id,
            "StoreId": store_id,
            "Items": order_items,
            "Total": total,
            "Status": "PENDING",
            "CreatedAt": now,
            "UpdatedAt": now
        }

        orders_table.put_item(Item=order)

        carts_table.update_item(
            Key={"UserId": customer_id},
            UpdateExpression="SET #items = :empty",
            ExpressionAttributeNames={"#items": "Items"},
            ExpressionAttributeValues={":empty": []}
        )

        try:
            events_client.put_events(Entries=[{
                "Source": "cloudshop.orders",
                "DetailType": "OrderCreated",
                "Detail": json.dumps({
                    "OrderId": order_id,
                    "CustomerId": customer_id,
                    "Email": email,
                    "StoreId": store_id,
                    "Total": float(total),
                    "Status": "PENDING"
                }),
                "EventBusName": EVENT_BUS_NAME
            }])
        except Exception:
            pass

        return _response(201, order)

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
