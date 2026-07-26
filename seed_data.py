"""
Script de seed para CloudShop Marketplace.
Inserta tiendas y productos de prueba directamente en DynamoDB.

Uso:
    python seed_data.py

Requiere: boto3 (pip install boto3) y AWS CLI configurado con credenciales válidas (us-east-1).
"""
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

import sys

# ── Configuración de Entorno ───────────────────────────────────────────────────

# Permitir pasar el project_name por argumento o preguntarlo
if len(sys.argv) > 1:
    project_name = sys.argv[1]
else:
    print("---------------------------------------------------------")
    project_name = input("Ingresa tu project_name (ej. cloudshop-tato) \n[Presiona Enter para usar 'cloudshop']: ").strip() or "cloudshop"
    print("---------------------------------------------------------")

REGION = "us-east-1"
STORES_TABLE = f"{project_name}-stores"
PRODUCTS_TABLE = f"{project_name}-products"

print(f"Usando tablas: {STORES_TABLE} y {PRODUCTS_TABLE}")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
stores_table = dynamodb.Table(STORES_TABLE)
products_table = dynamodb.Table(PRODUCTS_TABLE)

NOW = datetime.utcnow().isoformat()
OWNER_ID = "seed-admin"


# ── Tiendas ────────────────────────────────────────────────────────────────────

STORES = [
    {
        "Name": "TechZone",
        "Description": "Tienda especializada en electronica y accesorios tecnologicos.",
        "OwnerId": OWNER_ID,
        "Email": "contacto@techzone.sv",
        "Phone": "+503 2200-1100",
        "Address": "Centro Comercial Multiplaza, San Salvador",
    },
    {
        "Name": "Moda Elite",
        "Description": "Ropa y accesorios de moda para toda la familia.",
        "OwnerId": OWNER_ID,
        "Email": "ventas@modaelite.sv",
        "Phone": "+503 2200-2200",
        "Address": "Av. Masferrer Norte 34, San Salvador",
    },
    {
        "Name": "Casa & Hogar",
        "Description": "Todo para decorar y equipar tu hogar.",
        "OwnerId": OWNER_ID,
        "Email": "info@casahogar.sv",
        "Phone": "+503 2200-3300",
        "Address": "Bulevar del Ejercito Km 8, San Salvador",
    },
]


# ── Productos por tienda ────────────────────────────────────────────────────────

PRODUCTS_BY_STORE = {
    "TechZone": [
        {
            "Code": "TECH-001",
            "Name": "Laptop UltraBook Pro 15",
            "Description": "Procesador Intel Core i7, 16 GB RAM, SSD 512 GB, pantalla FHD.",
            "Category": "Computadoras",
            "Price": "1299.99",
            "Stock": 15,
        },
        {
            "Code": "TECH-002",
            "Name": "Audifonos Bluetooth ANC",
            "Description": "Cancelacion activa de ruido, 30 h de bateria, plegables.",
            "Category": "Audio",
            "Price": "89.99",
            "Stock": 40,
        },
        {
            "Code": "TECH-003",
            "Name": "Smartphone Galaxy X12",
            "Description": "6.7 AMOLED, 256 GB, camara triple 108 MP, 5G.",
            "Category": "Telefonos",
            "Price": "749.00",
            "Stock": 25,
        },
        {
            "Code": "TECH-004",
            "Name": "Monitor 4K 27 pulgadas",
            "Description": "Panel IPS, 144 Hz, HDR400, conectividad USB-C y HDMI.",
            "Category": "Monitores",
            "Price": "399.99",
            "Stock": 10,
        },
        {
            "Code": "TECH-005",
            "Name": "Teclado Mecanico RGB",
            "Description": "Switches tacticos, iluminacion por tecla, diseno TKL.",
            "Category": "Perifericos",
            "Price": "79.99",
            "Stock": 50,
        },
    ],
    "Moda Elite": [
        {
            "Code": "MODA-001",
            "Name": "Vestido Casual Floral",
            "Description": "Tela 100% algodon, estampado floral, disponible tallas S-XL.",
            "Category": "Vestidos",
            "Price": "34.99",
            "Stock": 60,
        },
        {
            "Code": "MODA-002",
            "Name": "Jean Slim Fit Hombre",
            "Description": "Denim premium, corte slim, tallas 28-38.",
            "Category": "Pantalones",
            "Price": "45.00",
            "Stock": 80,
        },
        {
            "Code": "MODA-003",
            "Name": "Chaqueta de Cuero Sintetico",
            "Description": "Estilo vintage, forro interior, tallas S-XXL.",
            "Category": "Chaquetas",
            "Price": "69.99",
            "Stock": 30,
        },
        {
            "Code": "MODA-004",
            "Name": "Zapatillas Running Pro",
            "Description": "Suela amortiguada, transpirable, tallas 35-45.",
            "Category": "Calzado",
            "Price": "59.99",
            "Stock": 45,
        },
        {
            "Code": "MODA-005",
            "Name": "Cartera Cuero Mujer",
            "Description": "Cuero genuino, multiples compartimentos, varios colores.",
            "Category": "Accesorios",
            "Price": "29.99",
            "Stock": 70,
        },
    ],
    "Casa & Hogar": [
        {
            "Code": "HOGAR-001",
            "Name": "Juego de Sabanas King Size",
            "Description": "Microfibra 1200 hilos, incluye funda y 2 fundas almohada.",
            "Category": "Dormitorio",
            "Price": "39.99",
            "Stock": 35,
        },
        {
            "Code": "HOGAR-002",
            "Name": "Set de Ollas Antiadherentes",
            "Description": "6 piezas de acero inoxidable con recubrimiento antiadherente.",
            "Category": "Cocina",
            "Price": "89.99",
            "Stock": 20,
        },
        {
            "Code": "HOGAR-003",
            "Name": "Lampara de Pie LED",
            "Description": "3 niveles de brillo, luz calida/fria, diseno escandinavo.",
            "Category": "Iluminacion",
            "Price": "49.99",
            "Stock": 25,
        },
        {
            "Code": "HOGAR-004",
            "Name": "Organizador Multiusos 5 Cajones",
            "Description": "Plastico resistente, apilable, ideal para oficina y bano.",
            "Category": "Organizacion",
            "Price": "24.99",
            "Stock": 55,
        },
        {
            "Code": "HOGAR-005",
            "Name": "Cuadros Decorativos Set x3",
            "Description": "Lienzo impreso HD, marco negro, tematica abstracta.",
            "Category": "Decoracion",
            "Price": "44.99",
            "Stock": 40,
        },
    ],
}


# ── Insercion ──────────────────────────────────────────────────────────────────

def seed():
    print("=" * 60)
    print("  CloudShop Seed - Iniciando carga de datos de prueba")
    print("=" * 60)

    store_id_map = {}

    print("\n[*] Creando tiendas...\n")
    for store_data in STORES:
        store_id = str(uuid.uuid4())
        item = {
            "StoreId": store_id,
            "Status": "ACTIVE",
            "CreatedAt": NOW,
            "UpdatedAt": NOW,
            **store_data,
        }
        stores_table.put_item(Item=item)
        store_id_map[store_data["Name"]] = store_id
        print(f"  OK Tienda: {store_data['Name']}  (ID: {store_id})")

    print("\n[*] Creando productos...\n")
    total_products = 0
    for store_name, products in PRODUCTS_BY_STORE.items():
        store_id = store_id_map[store_name]
        for prod in products:
            product_id = str(uuid.uuid4())
            item = {
                "StoreId": store_id,
                "ProductId": product_id,
                "Status": "ACTIVE",
                "CreatedAt": NOW,
                "UpdatedAt": NOW,
                "Price": Decimal(str(prod["Price"])),
                "Stock": int(prod["Stock"]),
                **{k: v for k, v in prod.items() if k not in ("Price", "Stock")},
            }
            products_table.put_item(Item=item)
            print(f"  OK [{store_name}] {prod['Name']}  - ${prod['Price']}")
            total_products += 1

    print(f"\n{'=' * 60}")
    print(f"  Seed completado: {len(STORES)} tiendas / {total_products} productos")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    seed()
