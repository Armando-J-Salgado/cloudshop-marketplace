import json
import os
from decimal import Decimal
from collections import defaultdict

import boto3
from boto3.dynamodb.conditions import Attr

dynamodb = boto3.resource("dynamodb")

ORDERS_TABLE = os.environ.get("ORDERS_TABLE_NAME", "Orders")
PRODUCTS_TABLE = os.environ.get("PRODUCTS_TABLE_NAME", "Products")

orders_table = dynamodb.Table(ORDERS_TABLE)
products_table = dynamodb.Table(PRODUCTS_TABLE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    """
    Dashboard Ejecutivo - Módulo 6 del proyecto.
    Solo accesible para admin u operator.

    Retorna:
      - Total de ventas
      - Ventas por tienda
      - Productos más vendidos
      - Productos agotados (stock = 0)
      - Clientes con más compras
      - Pedidos por estado
    """
    try:
        claims = event["requestContext"]["authorizer"]["claims"]
        user_groups = claims.get("cognito:groups", "")

        is_admin = "admin" in user_groups or "operator" in user_groups

        if not is_admin:
            return _response(403, {"message": "No autorizado. Solo admin u operator pueden ver el dashboard"})

        # --- Obtener todos los pedidos ---
        orders = _scan_all(orders_table)

        # --- Obtener todos los productos ---
        products = _scan_all(products_table)

        # --- Calcular métricas ---
        total_sales = Decimal("0")
        sales_by_store = defaultdict(lambda: Decimal("0"))
        product_sales_count = defaultdict(lambda: {"name": "", "quantity": 0})
        customer_orders_count = defaultdict(int)
        orders_by_status = defaultdict(int)

        for order in orders:
            status = order.get("Status", "")
            orders_by_status[status] += 1

            customer_id = order.get("CustomerId", "")
            customer_orders_count[customer_id] += 1

            # Solo contar ventas de pedidos no cancelados
            if status != "CANCELLED":
                total = Decimal(str(order.get("Total", 0)))
                total_sales += total

                store_id = order.get("StoreId", "unknown")
                sales_by_store[store_id] += total

                # Contar productos vendidos
                for item in order.get("Items", []):
                    pid = item.get("ProductId", "")
                    qty = int(item.get("Quantity", 0))
                    product_sales_count[pid]["quantity"] += qty
                    if not product_sales_count[pid]["name"]:
                        product_sales_count[pid]["name"] = item.get("Name", pid)

        # --- Top 10 productos más vendidos ---
        top_products = sorted(
            [{"ProductId": pid, "Name": data["name"], "TotalSold": data["quantity"]}
             for pid, data in product_sales_count.items()],
            key=lambda x: x["TotalSold"],
            reverse=True
        )[:10]

        # --- Productos agotados (stock = 0) ---
        out_of_stock = []
        for product in products:
            stock = int(product.get("Stock", 0))
            if stock == 0 and product.get("Status") == "ACTIVE":
                out_of_stock.append({
                    "ProductId": product.get("ProductId", ""),
                    "Name": product.get("Name", ""),
                    "StoreId": product.get("StoreId", "")
                })

        # --- Top 10 clientes con más compras ---
        top_customers = sorted(
            [{"CustomerId": cid, "OrderCount": count}
             for cid, count in customer_orders_count.items()],
            key=lambda x: x["OrderCount"],
            reverse=True
        )[:10]

        # --- Ventas por tienda ---
        sales_by_store_list = [
            {"StoreId": sid, "TotalSales": amount}
            for sid, amount in sales_by_store.items()
        ]

        dashboard = {
            "TotalSales": total_sales,
            "TotalOrders": len(orders),
            "SalesByStore": sales_by_store_list,
            "TopProducts": top_products,
            "OutOfStockProducts": out_of_stock,
            "TopCustomers": top_customers,
            "OrdersByStatus": dict(orders_by_status)
        }

        return _response(200, dashboard)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return _response(500, {"message": "Error interno del servidor"})


def _scan_all(table):
    """Scan completo de una tabla con paginación automática."""
    items = []
    response = table.scan()
    items.extend(response.get("Items", []))

    while "LastEvaluatedKey" in response:
        response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
        items.extend(response.get("Items", []))

    return items


def _response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "OPTIONS,GET"
        },
        "body": json.dumps(body, cls=DecimalEncoder)
    }
