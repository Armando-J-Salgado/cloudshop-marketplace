# Spec Plan: Event Handlers Fix

## Objective
Implement two fixes to improve event handling in the backend:
1. Enable mutation handlers (products, stores, carts, users) to emit events to EventBridge for audit processing
2. Update the notification handler to read from EventBridge events instead of HTTP body (order events only)

## Requirements Summary

### Fix 1: Event Emission from Backend Handlers
The following mutation handlers must emit events to EventBridge:
- **Products:** `create_product`, `update_product`, `delete_product`
- **Stores:** `create_store`, `update_store`, `delete_store`
- **Carts:** `clear_cart`, `remove_product` (only these two, not `add_product` or `modify_quantity`)
- **Users:** `register-user`, `update-user`, `delete-user`

**Event Schema Required by Audit Handler:**
```json
{
  "usuario": "admin01",
  "accion": "ELIMINAR_PRODUCTO",
  "fecha": "2026-07-25",
  "resultado": "EXITOSO"
}
```

**Note:** Orders handlers already have event emission implemented - review for errors but do not modify unless there is a logic or Terraform integration error.

### Fix 2: Notification Handler Input Format
- The notification handler (`send-order-notification`) will ONLY be triggered as an EventBridge target
- It should extract data from `event['detail']` instead of parsing HTTP body
- Only order-related events trigger notifications (`OrderCreated`, `OrderCancelled`, `OrderStatusChanged`)

### Error Handling
- Event emission exceptions should be **printed** (not silently caught) so CloudWatch captures them
- Primary operation should not fail if event emission fails

### Configuration
- Use AWS Systems Manager Parameter Store for configuration (not environment variables)
- Follow existing patterns in user handlers for Parameter Store access
- Event Bus Name should be retrieved from Parameter Store

---

## Implementation Details

### Phase 1: Standardize Event Emission Pattern

#### Event Structure
All handlers emitting events must follow this pattern:

```python
import boto3
import json
from datetime import datetime

events_client = boto3.client("events")

# Retrieve EVENT_BUS_NAME from Parameter Store
EVENT_BUS_PARAM = '/app/eventbridge/event-bus-name'

def get_event_bus_name():
    ssm_client = boto3.client('ssm')
    response = ssm_client.get_parameter(Name=EVENT_BUS_PARAM, WithDecryption=False)
    return response['Parameter']['Value']

# In handler, after successful operation:
try:
    event_detail = {
        "usuario": user_identifier,      # From Cognito claims
        "accion": ACTION_TYPE_CONSTANT,   # e.g., "CREAR_PRODUCTO"
        "fecha": datetime.utcnow().isoformat(),
        "resultado": "EXITOSO"            # Or "FALLIDO" on error
    }
    
    events_client.put_events(
        Entries=[{
            'Source': f'cloudshop.{entity_type}',
            'DetailType': detail_type,
            'Detail': json.dumps(event_detail),
            'EventBusName': get_event_bus_name()
        }]
    )
except Exception as e:
    print(f"ERROR emitting event to EventBridge: {str(e)}")
    # Do not re-raise - primary operation succeeded
```

#### Action Type Constants Mapping

| Handler | Action Type (`accion`) | Source | DetailType |
|---------|----------------------|--------|------------|
| `create_product` | `CREAR_PRODUCTO` | `cloudshop.products` | `ProductCreated` |
| `update_product` | `ACTUALIZAR_PRODUCTO` | `cloudshop.products` | `ProductUpdated` |
| `delete_product` | `ELIMINAR_PRODUCTO` | `cloudshop.products` | `ProductDeleted` |
| `create_store` | `CREAR_TIENDA` | `cloudshop.stores` | `StoreCreated` |
| `update_store` | `ACTUALIZAR_TIENDA` | `cloudshop.stores` | `StoreUpdated` |
| `delete_store` | `ELIMINAR_TIENDA` | `cloudshop.stores` | `StoreDeleted` |
| `clear_cart` | `VACIAR_CARRITO` | `cloudshop.carts` | `CartCleared` |
| `remove_product` (from cart) | `ELIMINAR_PRODUCTO_CARRITO` | `cloudshop.carts` | `ProductRemovedFromCart` |
| `register-user` | `REGISTRAR_USUARIO` | `cloudshop.users` | `UserRegistered` |
| `update-user` | `ACTUALIZAR_USUARIO` | `cloudshop.users` | `UserUpdated` |
| `delete-user` | `ELIMINAR_USUARIO` | `cloudshop.users` | `UserDeleted` |

#### User Identifier Extraction
Extract user identifier from Cognito claims based on handler type:

```python
claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
user_id = claims.get("email") or claims.get("cognito:username") or claims.get("sub", "SYSTEM")
```

For admin operations where available, use the operator's identifier.

---

### Phase 2: Modify Specific Handlers

#### 2.1 Product Handlers

**Files to modify:**
- `/workspace/backend/lambdas/products/create_product/lambda_function.py`
- `/workspace/backend/lambdas/products/update_product/lambda_function.py`
- `/workspace/backend/lambdas/products/delete_product/lambda_function.py`

**Changes:**
1. Add boto3 events client import
2. Add Parameter Store function for EVENT_BUS_NAME
3. After successful DynamoDB operation, emit event with appropriate action type
4. Extract user from claims (`cognito:username` or `email`)

**Example for `create_product`:**
```python
# After products_table.put_item(Item=product)
try:
    username = claims.get("cognito:username") or claims.get("email", "SYSTEM")
    event_detail = {
        "usuario": username,
        "accion": "CREAR_PRODUCTO",
        "fecha": now,
        "resultado": "EXITOSO"
    }
    events_client.put_events(...)
except Exception as e:
    print(f"ERROR emitting event: {str(e)}")
```

#### 2.2 Store Handlers

**Files to modify:**
- `/workspace/backend/lambdas/stores/create_store/lambda_function.py`
- `/workspace/backend/lambdas/stores/update_store/lambda_function.py`
- `/workspace/backend/lambdas/stores/delete_store/lambda_function.py`

**Changes:**
1. Add boto3 events client import
2. Add Parameter Store function for EVENT_BUS_NAME
3. After successful DynamoDB operation, emit event
4. Extract user from claims

#### 2.3 Cart Handlers

**Files to modify:**
- `/workspace/backend/lambdas/carts/clear_cart/lambda_function.py`
- `/workspace/backend/lambdas/carts/remove_product/lambda_function.py`

**Note:** `add_product` and `modify_quantity` are NOT in scope per requirements.

**Changes:**
1. Add boto3 events client import
2. Add Parameter Store function for EVENT_BUS_NAME
3. After successful DynamoDB operation, emit event
4. Extract `customer_id` from claims (`sub`)

#### 2.4 User Handlers

**Files to modify:**
- `/workspace/backend/lambdas/users/register-user/handler.py`
- `/workspace/backend/lambdas/users/update-user/handler.py`
- `/workspace/backend/lambdas/users/delete-user/handler.py`

**Changes:**
1. Add boto3 events client import
2. Add Parameter Store function for EVENT_BUS_NAME (reuse existing `get_parameter` function)
3. After successful Cognito operation, emit event
4. For user operations, the `usuario` field should reflect the operator performing the action:
   - For `register-user`: Use `"SYSTEM"` or the calling admin/operator email if available
   - For `update-user` and `delete-user`: Extract from claims if available, otherwise `"SYSTEM"`

---

### Phase 3: Update Notification Handler

**File to modify:**
- `/workspace/backend/lambdas/notifications/send-order-notification/handler.py`

**Current Behavior:**
- Parses `event.get('body', '{}')` as JSON
- Expects HTTP request format with `order_id`, `customer_id`, `customer_email`, etc.

**New Behavior:**
- Extract data from `event['detail']` (EventBridge event format)
- Support only order-related events: `OrderCreated`, `OrderCancelled`, `OrderStatusChanged`

**Expected EventBridge Event Format:**
```json
{
  "version": "0",
  "id": "...",
  "detail-type": "OrderCreated",
  "source": "cloudshop.orders",
  "account": "...",
  "time": "2026-07-25T...",
  "region": "us-east-1",
  "resources": [],
  "detail": {
    "OrderId": "...",
    "CustomerId": "...",
    "Email": "customer@example.com",
    "StoreId": "...",
    "Total": 100.00,
    "Status": "PENDING"
  }
}
```

**Changes Required:**

1. **Remove body parsing logic:**
   ```python
   # OLD:
   body = json.loads(event.get('body', '{}'))
   
   # NEW:
   detail = event.get('detail', {})
   ```

2. **Map EventBridge fields to notification data:**
   ```python
   order_id = detail.get('OrderId')
   customer_id = detail.get('CustomerId')
   customer_email = detail.get('Email')
   status = detail.get('Status')
   total = detail.get('Total')
   items = detail.get('Items', [])  # May need to fetch from Orders table if not in event
   ```

3. **Remove HTTP-specific response format:**
   - Return simple success/failure dict suitable for Lambda invoked by EventBridge
   - Remove `statusCode` and `headers` (not needed for EventBridge target)

4. **Add validation for EventBridge event structure:**
   ```python
   if not detail or not detail.get('OrderId'):
       print("Invalid event: missing OrderId in detail")
       return {"statusCode": 400, "body": "Invalid event format"}
   ```

5. **Handle different order event types:**
   - `OrderCreated`: Send confirmation email
   - `OrderCancelled`: Send cancellation email
   - `OrderStatusChanged`: Send status update email

---

### Phase 4: Review Order Handlers

**Files to review (no changes unless errors found):**
- `/workspace/backend/lambdas/orders/create_order/lambda_function.py`
- `/workspace/backend/lambdas/orders/cancel_order/lambda_function.py`
- `/workspace/backend/lambdas/orders/update_order_status/lambda_function.py`

**Review Checklist:**
1. ✅ Event emission is present
2. ⚠️ Exception handling currently silences errors (`pass`) - should print to CloudWatch
3. ✅ Uses `EVENT_BUS_NAME` from environment variable - should use Parameter Store
4. ✅ Event detail structure differs from new standard but is acceptable for orders (already working)

**Required Changes (if any):**
- Update exception handling to print errors instead of `pass`
- Migrate `EVENT_BUS_NAME` from environment variable to Parameter Store

---

## Technical Specifications

### Parameter Store Paths

| Parameter | Path | Description |
|-----------|------|-------------|
| Event Bus Name | `/app/eventbridge/event-bus-name` | Name of the EventBridge event bus |
| User Pool ID | `/app/cognito/user-pool-id` | Already in use by user handlers |
| SES Template | `/app/ses/order-template-name` | Already in use by notification handler |
| Source Email | `/app/ses/source-email` | Already in use by notification handler |

### Common Utility Function

Create a shared utility module or copy this pattern to each handler:

```python
def get_event_bus_name():
    """Retrieve Event Bus Name from Parameter Store."""
    ssm_client = boto3.client('ssm')
    EVENT_BUS_PARAM = '/app/eventbridge/event-bus-name'
    response = ssm_client.get_parameter(Name=EVENT_BUS_PARAM, WithDecryption=False)
    return response['Parameter']['Value']
```

### Event Emission Helper Function

To reduce code duplication, consider adding this helper:

```python
def emit_audit_event(action_type, usuario, resultado="EXITOSO"):
    """Emit an audit event to EventBridge."""
    try:
        event_detail = {
            "usuario": usuario,
            "accion": action_type,
            "fecha": datetime.utcnow().isoformat(),
            "resultado": resultado
        }
        
        events_client.put_events(
            Entries=[{
                'Source': 'cloudshop.generic',  # Override per handler
                'DetailType': action_type,
                'Detail': json.dumps(event_detail),
                'EventBusName': get_event_bus_name()
            }]
        )
        print(f"Audit event emitted: {action_type}")
    except Exception as e:
        print(f"ERROR emitting audit event {action_type}: {str(e)}")
```

---

## Testing Strategy

### Unit Testing (Manual Verification)
1. Verify each modified handler emits events with correct schema
2. Verify notification handler correctly parses EventBridge events
3. Verify error messages appear in CloudWatch when event emission fails

### Integration Testing
1. Deploy changes to staging environment
2. Trigger each mutation operation
3. Verify events appear in EventBridge
4. Verify audit records are created in DynamoDB
5. Verify notification emails are sent for order events

### Rollback Plan
If issues arise:
1. Revert Lambda code to previous version
2. EventBridge rules can be disabled without affecting primary operations
3. Audit trail gap is acceptable during rollback

---

## Success Criteria

1. ✅ All specified mutation handlers emit events to EventBridge
2. ✅ Event schema matches required format (`usuario`, `accion`, `fecha`, `resultado`)
3. ✅ Audit handler successfully processes events and writes to DynamoDB
4. ✅ Notification handler correctly reads from EventBridge events
5. ✅ Notification handler only processes order-related events
6. ✅ Event emission errors are logged to CloudWatch
7. ✅ All handlers use Parameter Store for configuration
8. ✅ No changes to Terraform infrastructure code

---

## Files to Modify Summary

| File Path | Changes |
|-----------|---------|
| `backend/lambdas/products/create_product/lambda_function.py` | Add event emission |
| `backend/lambdas/products/update_product/lambda_function.py` | Add event emission |
| `backend/lambdas/products/delete_product/lambda_function.py` | Add event emission |
| `backend/lambdas/stores/create_store/lambda_function.py` | Add event emission |
| `backend/lambdas/stores/update_store/lambda_function.py` | Add event emission |
| `backend/lambdas/stores/delete_store/lambda_function.py` | Add event emission |
| `backend/lambdas/carts/clear_cart/lambda_function.py` | Add event emission |
| `backend/lambdas/carts/remove_product/lambda_function.py` | Add event emission |
| `backend/lambdas/users/register-user/handler.py` | Add event emission |
| `backend/lambdas/users/update-user/handler.py` | Add event emission |
| `backend/lambdas/users/delete-user/handler.py` | Add event emission |
| `backend/lambdas/notifications/send-order-notification/handler.py` | Change input from body to event detail |
| `backend/lambdas/orders/*/lambda_function.py` | Review only - fix error logging and Parameter Store usage |

---

## Out of Scope

- Modifying Terraform infrastructure
- Adding event emission to GET handlers (read operations)
- Adding event emission to `add_product` and `modify_quantity` cart handlers
- Modifying audit handler logic
- Creating new Lambda functions
- Changing DynamoDB table schemas
