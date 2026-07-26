import base64
import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Key

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
    Lectura de la tabla de auditoria. Solo accesible para admin.

    La tabla Audit no tiene GSI (PK=UserId, SK=Timestamp), asi que no hay
    forma de listar "todos los registros" sin un scan. Se pagina con
    Limit + ExclusiveStartKey para no sobrecargar DynamoDB, igual que el
    resto de los listados (products/stores/orders).
    """
    try:
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        if not _is_admin(claims):
            return _response(403, {"message": "No autorizado. Solo un administrador puede consultar la auditoria"})

        query_params = event.get("queryStringParameters") or {}
        limit = _parse_limit(query_params.get("limit"))
        next_token = query_params.get("next_token")
        user_id_filter = query_params.get("user_id")

        if user_id_filter:
            # Si se filtra por usuario, se puede usar Query (mas eficiente
            # que un scan completo) ya que UserId es la partition key.
            query_kwargs = {
                "KeyConditionExpression": Key("UserId").eq(user_id_filter),
                "Limit": limit,
                "ScanIndexForward": False,
            }
            if next_token:
                try:
                    query_kwargs["ExclusiveStartKey"] = json.loads(base64.b64decode(next_token).decode("utf-8"))
                except Exception:
                    return _response(400, {"message": "next_token invalido"})
            response = audit_table.query(**query_kwargs)
        else:
            scan_kwargs = {"Limit": limit}
            if next_token:
                try:
                    scan_kwargs["ExclusiveStartKey"] = json.loads(base64.b64decode(next_token).decode("utf-8"))
                except Exception:
                    return _response(400, {"message": "next_token invalido"})
            response = audit_table.scan(**scan_kwargs)

        items = response.get("Items", [])
        # Mas recientes primero
        items.sort(key=lambda r: r.get("Timestamp", ""), reverse=True)

        result = {
            "records": items,
            "count": len(items),
        }

        if "LastEvaluatedKey" in response:
            result["next_token"] = base64.b64encode(
                json.dumps(response["LastEvaluatedKey"], cls=DecimalEncoder).encode("utf-8")
            ).decode("utf-8")

        return _response(200, result)

    except Exception as e:
        print(f"ERROR: {str(e)}")
        return _response(500, {"message": "Error interno del servidor"})


def _is_admin(claims):
    user_groups = claims.get("cognito:groups", "")
    if isinstance(user_groups, list):
        groups = {str(g).strip() for g in user_groups}
    else:
        groups = {g.strip() for g in str(user_groups).split(",") if g.strip()}
    return "admin" in groups


def _parse_limit(value):
    try:
        limit = int(value) if value is not None else 20
        if limit < 1 or limit > 100:
            return 20
        return limit
    except Exception:
        return 20


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
