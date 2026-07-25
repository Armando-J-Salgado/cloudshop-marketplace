import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3

dynamodb = boto3.resource("dynamodb")

AUDIT_TABLE = os.environ.get("AUDIT_TABLE_NAME", "Audit")
audit_table = dynamodb.Table(AUDIT_TABLE)


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


def lambda_handler(event, context):
    """
    Lambda consumidora de EventBridge.
    Responsabilidad unica: registrar acciones relevantes en la tabla Audit.

    Esquema de la tabla Audit:
      PK: UserId (String)
      SK: Timestamp (String) → ISO 8601 + UUID para unicidad
      Atributos: Action, Result, Details
    """
    try:
        detail_type = event.get("detail-type", "")
        detail = event.get("detail", {})

        user_id = detail.get("CustomerId") or detail.get("UserId") or detail.get("ClientId", "SYSTEM")
        timestamp = datetime.utcnow().isoformat() + "#" + str(uuid.uuid4())[:8]

        audit_table.put_item(Item={
            "UserId": user_id,
            "Timestamp": timestamp,
            "Action": detail_type,
            "Result": detail.get("Result", "EXITOSO"),
            "Details": json.dumps(detail, cls=DecimalEncoder)
        })

        print(f"Audit registrado: {detail_type} | User: {user_id}")

        return {"statusCode": 200, "body": "Audit record created"}

    except Exception as e:
        print(f"ERROR en audit_handler: {str(e)}")
        print(f"Evento recibido: {json.dumps(event, default=str)}")
        raise e
