# Implementation Plan: Event Handlers Fix

## Overview

This implementation plan details the technical steps to implement two fixes for the backend event handling system:

1. **Fix 1**: Enable mutation handlers to emit events to EventBridge for audit processing
2. **Fix 2**: Update the notification handler to consume EventBridge events instead of HTTP body

---

## Technical Context

### Current State Analysis

**Handlers Requiring Event Emission (13 total):**

| Entity | Operations | File Paths |
|--------|-----------|------------|
| Products | create, update, delete | `backend/lambdas/products/create_product/lambda_function.py`<br>`backend/lambdas/products/update_product/lambda_function.py`<br>`backend/lambdas/products/delete_product/lambda_function.py` |
| Stores | create, update, delete | `backend/lambdas/stores/create_store/lambda_function.py`<br>`backend/lambdas/stores/update_store/lambda_function.py`<br>`backend/lambdas/stores/delete_store/lambda_function.py` |
| Carts | remove_product, clear_cart | `backend/lambdas/carts/remove_product/lambda_function.py`<br>`backend/lambdas/carts/clear_cart/lambda_function.py` |
| Users | register, update, delete | `backend/lambdas/users/register-user/handler.py`<br>`backend/lambdas/users/update-user/handler.py`<br>`backend/lambdas/users/delete-user/handler.py` |

**Handlers with Existing Event Emission (3 total - Review Only):**

| Entity | Operations | File Paths |
|--------|-----------|------------|
| Orders | create, cancel, update_status | `backend/lambdas/orders/create_order/lambda_function.py`<br>`backend/lambdas/orders/cancel_order/lambda_function.py`<br>`backend/lambdas/orders/update_order_status/lambda_function.py` |

**Handlers to Modify for Event Consumption:**

| Handler | Purpose | File Path |
|---------|---------|-----------|
| Notification | Send order notifications | `backend/lambdas/notifications/send-order-notification/handler.py` |
| Audit | Record audit events | `backend/lambdas/events/audit_handler/lambda_function.py` |

---

## Fix 1: Event Emission from Mutation Handlers

### Event Schema

All handlers must emit events with the following structure:

```json
{
  "userId": "<Cognito sub claim>",
  "action": "<ACTION_TYPE_CONSTANT>",
  "timestamp": "<ISO 8601 format>",
  "result": "SUCCESS",
  "details": {
    "<entity-specific fields>"
  }
}
```

### Action Type Constants

| Handler | Action Type |
|---------|-------------|
| `create_product` | `CREATE_PRODUCT` |
| `update_product` | `UPDATE_PRODUCT` |
| `delete_product` | `DELETE_PRODUCT` |
| `create_store` | `CREATE_STORE` |
| `update_store` | `UPDATE_STORE` |
| `delete_store` | `DELETE_STORE` |
| `remove_product` (cart) | `REMOVE_PRODUCT_FROM_CART` |
| `clear_cart` | `CLEAR_CART` |
| `register-user` | `REGISTER_USER` |
| `update-user` | `UPDATE_USER` |
| `delete-user` | `DELETE_USER` |

### Parameter Store Configuration

**Parameter Path:** `/cloudshop/eventbus/name`

All handlers will retrieve the Event Bus name from Parameter Store using this path.

### Implementation Pattern

Each handler requiring event emission will follow this pattern:

```python
import json
import os
from datetime import datetime
import boto3

# Initialize clients
dynamodb = boto3.resource("dynamodb")
ssm_client = boto3.client('ssm')
events_client = boto3.client("events")

# Parameter Store path
PARAM_EVENT_BUS_NAME = '/cloudshop/eventbus/name'

def get_parameter(param_name):
    """Retrieve parameter value from AWS Systems Manager Parameter Store."""
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def get_event_bus_name():
    """Get Event Bus name from Parameter Store."""
    return get_parameter(PARAM_EVENT_BUS_NAME)

def lambda_handler(event, context):
    try:
        # Extract user identity from Cognito claims
        claims = event["requestContext"]["authorizer"]["claims"]
        user_id = claims["sub"]
        
        # ... existing business logic ...
        
        # Perform database operation
        # ... dynamodb operations ...
        
        # Emit event to EventBridge
        try:
            event_bus_name = get_event_bus_name()
            now = datetime.utcnow().isoformat()
            
            event_detail = {
                "userId": user_id,
                "action": "<ACTION_TYPE>",
                "timestamp": now,
                "result": "SUCCESS",
                "details": {
                    # Entity-specific fields
                }
            }
            
            events_client.put_events(Entries=[{
                "Source": "cloudshop.<entity>",
                "DetailType": "<ActionTypeEvent>",
                "Detail": json.dumps(event_detail),
                "EventBusName": event_bus_name
            }])
        except Exception as e:
            print(f"Failed to emit event: {str(e)}")
            # Primary operation succeeds even if event emission fails
        
        return _response(200, result)
        
    except Exception as e:
        print(f"ERROR: {str(e)}")
        return _response(500, {"message": "Internal server error"})
```

### Handler-Specific Details

#### Product Handlers

**Source:** `cloudshop.products`

**Create Product:**
- DetailType: `ProductCreated`
- Details: `{"ProductId": "...", "StoreId": "...", "Code": "...", "Name": "..."}`

**Update Product:**
- DetailType: `ProductUpdated`
- Details: `{"ProductId": "...", "StoreId": "...", "UpdatedFields": {...}}`

**Delete Product:**
- DetailType: `ProductDeleted`
- Details: `{"ProductId": "...", "StoreId": "..."}`

#### Store Handlers

**Source:** `cloudshop.stores`

**Create Store:**
- DetailType: `StoreCreated`
- Details: `{"StoreId": "...", "Name": "...", "OwnerId": "..."}`

**Update Store:**
- DetailType: `StoreUpdated`
- Details: `{"StoreId": "...", "UpdatedFields": {...}}`

**Delete Store:**
- DetailType: `StoreDeleted`
- Details: `{"StoreId": "..."}`

#### Cart Handlers

**Source:** `cloudshop.carts`

**Remove Product from Cart:**
- DetailType: `ProductRemovedFromCart`
- Details: `{"CustomerId": "...", "ProductId": "..."}`

**Clear Cart:**
- DetailType: `CartCleared`
- Details: `{"CustomerId": "..."}`

Note: Cart handlers extract `CustomerId` from Cognito `sub` claim (the authenticated user).

#### User Handlers

**Source:** `cloudshop.users`

**Register User:**
- DetailType: `UserRegistered`
- Details: `{"UserId": "...", "Email": "...", "Name": "..."}`
- Note: `user_id` in event is the admin/operator who performed the registration

**Update User:**
- DetailType: `UserUpdated`
- Details: `{"UserId": "...", "UpdatedFields": {...}}`
- Note: `user_id` in event is the admin/operator who performed the update

**Delete User:**
- DetailType: `UserDeleted`
- Details: `{"UserId": "..."}`
- Note: `user_id` in event is the admin/operator who performed the deletion

### Error Handling

- Event emission failures are logged to CloudWatch via `print()`
- Primary operation continues successfully even if event emission fails
- Exception message includes full error details for debugging

---

## Fix 2: Notification Handler Event Consumption

### Current Behavior

The notification handler currently:
- Parses HTTP body: `body = json.loads(event.get('body', '{}'))`
- Expects fields: `order_id`, `customer_id`, `customer_email`, `items`, `status`, `total`
- Returns HTTP response format

### New Behavior

The notification handler will:
- Parse EventBridge event detail: `detail = event.get('detail', {})`
- Support order-related events only: `OrderCreated`, `OrderCancelled`, `OrderStatusChanged`
- Enrich event data by fetching additional information from DynamoDB
- Return Lambda response format (no HTTP semantics)

### Event Mapping

| Event DetailType | Trigger Condition |
|-----------------|-------------------|
| `OrderCreated` | New order placed |
| `OrderCancelled` | Order cancelled |
| `OrderStatusChanged` | Order status updated |

### Data Enrichment Requirements

The notification must include:
- Customer ID (from event)
- Username (fetch from Cognito or include in event)
- Order ID (from event)
- Items with name and price (fetch from order in DynamoDB)
- Total (from event or DynamoDB)
- Status (from event)
- Store name and ID (fetch store from DynamoDB)

### Implementation Pattern

```python
import json
import boto3
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
ses_client = boto3.client('ses')
dynamodb = boto3.resource('dynamodb')

# Parameter Store paths
PARAM_SES_TEMPLATE = '/app/ses/order-template-name'
PARAM_SES_SOURCE_EMAIL = '/app/ses/source-email'
PARAM_EVENT_BUS_NAME = '/cloudshop/eventbus/name'

# Table names from Parameter Store
PARAM_ORDERS_TABLE = '/cloudshop/orders/table-name'
PARAM_STORES_TABLE = '/cloudshop/stores/table-name'

def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def lambda_handler(event, context):
    try:
        print("====== ORDER NOTIFICATION TRIGGERED ======")
        
        # Extract event detail from EventBridge
        detail_type = event.get('detail-type', '')
        detail = event.get('detail', {})
        
        # Only process order-related events
        supported_events = ['OrderCreated', 'OrderCancelled', 'OrderStatusChanged']
        if detail_type not in supported_events:
            print(f"Unsupported event type: {detail_type}")
            return {'statusCode': 200, 'body': 'Event type not supported'}
        
        # Extract basic fields from event
        order_id = detail.get('OrderId')
        customer_id = detail.get('CustomerId')
        status = detail.get('NewStatus') or detail.get('Status')
        
        if not order_id or not customer_id:
            print(f"Missing required fields in event: order_id={order_id}, customer_id={customer_id}")
            return {'statusCode': 400, 'body': 'Missing required fields'}
        
        # Get table names
        orders_table_name = get_parameter(PARAM_ORDERS_TABLE)
        stores_table_name = get_parameter(PARAM_STORES_TABLE)
        orders_table = dynamodb.Table(orders_table_name)
        stores_table = dynamodb.Table(stores_table_name)
        
        # Fetch complete order data from DynamoDB
        order_response = orders_table.get_item(
            Key={'CustomerId': customer_id, 'OrderId': order_id}
        )
        order = order_response.get('Item')
        
        if not order:
            print(f"Order not found: {order_id}")
            return {'statusCode': 404, 'body': 'Order not found'}
        
        # Fetch store data
        store_id = order.get('StoreId')
        store_name = store_id
        if store_id:
            store_response = stores_table.get_item(Key={'StoreId': store_id})
            store = store_response.get('Item')
            if store:
                store_name = store.get('Name', store_id)
        
        # Build notification data
        notification_data = {
            'order_id': order_id,
            'customer_id': customer_id,
            'username': customer_id,  # Will be enriched if username available
            'items': order.get('Items', []),
            'total': float(order.get('Total', 0)),
            'status': status,
            'store_id': store_id,
            'store_name': store_name
        }
        
        # Get SES configuration
        template_name = get_ses_template_name()
        source_email = get_ses_source_email()
        
        # Get customer email (may need to fetch from users table or include in event)
        customer_email = detail.get('Email')
        if not customer_email:
            # Fallback: fetch from user profile if available
            customer_email = f"{customer_id}@example.com"  # Placeholder
        
        # Prepare template data
        template_data = {
            'order_id': order_id,
            'customer_id': customer_id,
            'username': notification_data['username'],
            'items': notification_data['items'],
            'status': status,
            'total': str(notification_data['total']),
            'store_name': store_name,
            'store_id': store_id
        }
        
        # Send email via SES
        ses_client.send_templated_email(
            Source=source_email,
            Destination={'ToAddresses': [customer_email]},
            Template=template_name,
            TemplateData=json.dumps(template_data)
        )
        
        print(f"Notification sent for order: {order_id}")
        
        return {'statusCode': 200, 'body': 'Notification sent successfully'}
        
    except ClientError as e:
        print(f'SES error: {str(e)}')
        return {'statusCode': 500, 'body': 'Error sending notification'}
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return {'statusCode': 500, 'body': 'Internal server error'}
```

### Order Event Schema Compatibility

The notification handler must handle both existing order event schemas:

**OrderCreated:**
```json
{
  "OrderId": "...",
  "CustomerId": "...",
  "Email": "...",
  "StoreId": "...",
  "Total": 0.0,
  "Status": "PENDING"
}
```

**OrderCancelled:**
```json
{
  "OrderId": "...",
  "CustomerId": "...",
  "PreviousStatus": "...",
  "NewStatus": "CANCELLED",
  "CancelledAt": "...",
  "CancelledBy": "..."
}
```

**OrderStatusChanged:**
```json
{
  "OrderId": "...",
  "CustomerId": "...",
  "PreviousStatus": "...",
  "NewStatus": "...",
  "UpdatedAt": "..."
}
```

---

## Audit Handler Updates

### Current State

The audit handler currently expects:
- `CustomerId`, `UserId`, or `OperatorId` for user identification
- `DetailType` as action name
- `Result` field (defaults to "EXITOSO")

### Required Changes

The audit handler must support both schemas:

1. **Legacy Order Schema:** Uses `CustomerId`, `DetailType` directly
2. **New Standard Schema:** Uses `userId`, `action`, `timestamp`, `result`, `details`

### Updated Implementation Pattern

```python
def lambda_handler(event, context):
    try:
        detail_type = event.get("detail-type", "")
        detail = event.get("detail", {})
        
        # Support both schemas
        # New standard schema
        user_id = detail.get("userId")
        action = detail.get("action")
        timestamp = detail.get("timestamp")
        result = detail.get("result", "SUCCESS")
        details = detail.get("details", {})
        
        # Fallback to legacy order schema
        if not user_id:
            user_id = detail.get("CustomerId") or detail.get("UserId") or detail.get("OperatorId", "SYSTEM")
        if not action:
            action = detail_type
        if not timestamp:
            timestamp = datetime.utcnow().isoformat()
        
        # Generate sort key
        sk = timestamp + "#" + str(uuid.uuid4())[:8]
        
        audit_table.put_item(Item={
            "UserId": user_id,
            "Timestamp": sk,
            "Action": action,
            "Result": result,
            "Details": json.dumps(details)
        })
        
        print(f"Audit recorded: {action} | User: {user_id}")
        
        return {"statusCode": 200, "body": "Audit record created"}
        
    except Exception as e:
        print(f"ERROR in audit_handler: {str(e)}")
        print(f"Received event: {json.dumps(event, default=str)}")
        raise e
```

---

## Parameter Store Setup

### Required Parameters

| Parameter Path | Description | Example Value |
|---------------|-------------|---------------|
| `/cloudshop/eventbus/name` | Event Bus name for all handlers | `cloudshop-event-bus` |
| `/cloudshop/orders/table-name` | Orders DynamoDB table | `Orders` |
| `/cloudshop/stores/table-name` | Stores DynamoDB table | `Stores` |
| `/app/ses/order-template-name` | SES email template name | `order-notification-template` |
| `/app/ses/source-email` | SES verified source email | `noreply@cloudshop.com` |
| `/app/cognito/user-pool-id` | Cognito User Pool ID | `us-east-1_XXXXXXXXX` |

### Terraform Considerations

While Terraform modifications are out of scope for this implementation, the parameters above must exist in Parameter Store before deployment. The implementation assumes these parameters are provisioned separately.

---

## Implementation Phases

### Phase 1: Infrastructure Preparation
1. Verify Parameter Store parameters exist
2. Document missing parameters for Terraform team

### Phase 2: Event Emission Implementation
1. Implement event emission in product handlers (3 files)
2. Implement event emission in store handlers (3 files)
3. Implement event emission in cart handlers (2 files)
4. Implement event emission in user handlers (3 files)

### Phase 3: Order Handler Review
1. Review existing order event emission for schema consistency
2. Update if necessary to include all required fields for notification enrichment

### Phase 4: Notification Handler Update
1. Refactor to consume EventBridge events
2. Implement DynamoDB data enrichment
3. Remove HTTP-specific response handling

### Phase 5: Audit Handler Update
1. Update to support dual schema (legacy + new standard)
2. Test with both event types

### Phase 6: Testing & Validation
1. Unit test each handler independently
2. Integration test event flow end-to-end
3. Verify CloudWatch logging for errors

---

## Testing Strategy

### Unit Tests

For each modified handler:
- Mock boto3 clients (SSM, Events, DynamoDB)
- Test successful event emission
- Test event emission failure (should not affect primary operation)
- Test user identity extraction from claims

### Integration Tests

1. **Event Flow Test:**
   - Trigger a mutation (e.g., create product)
   - Verify event appears in EventBridge
   - Verify audit handler processes the event
   - Verify audit record in DynamoDB

2. **Notification Flow Test:**
   - Trigger order creation
   - Verify notification handler receives event
   - Verify email is sent via SES
   - Verify all required fields are included

### Success Criteria

- All 13 mutation handlers emit events with correct schema
- Notification handler successfully processes order events from EventBridge
- Audit handler records events from both legacy and new schemas
- Event emission failures are logged but don't block primary operations
- All handlers retrieve configuration from Parameter Store

---

## Files to Modify

| File Path | Change Type | Priority |
|-----------|-------------|----------|
| `backend/lambdas/products/create_product/lambda_function.py` | Add event emission | High |
| `backend/lambdas/products/update_product/lambda_function.py` | Add event emission | High |
| `backend/lambdas/products/delete_product/lambda_function.py` | Add event emission | High |
| `backend/lambdas/stores/create_store/lambda_function.py` | Add event emission | High |
| `backend/lambdas/stores/update_store/lambda_function.py` | Add event emission | High |
| `backend/lambdas/stores/delete_store/lambda_function.py` | Add event emission | High |
| `backend/lambdas/carts/remove_product/lambda_function.py` | Add event emission | High |
| `backend/lambdas/carts/clear_cart/lambda_function.py` | Add event emission | High |
| `backend/lambdas/users/register-user/handler.py` | Add event emission | High |
| `backend/lambdas/users/update-user/handler.py` | Add event emission | High |
| `backend/lambdas/users/delete-user/handler.py` | Add event emission | High |
| `backend/lambdas/notifications/send-order-notification/handler.py` | Refactor for EventBridge | High |
| `backend/lambdas/events/audit_handler/lambda_function.py` | Support dual schema | Medium |
| `backend/lambdas/orders/create_order/lambda_function.py` | Review only | Low |
| `backend/lambdas/orders/cancel_order/lambda_function.py` | Review only | Low |
| `backend/lambdas/orders/update_order_status/lambda_function.py` | Review only | Low |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Event emission failures block primary operations | Wrap in try-except, log error, continue |
| Missing Parameter Store parameters | Document required parameters, fail gracefully with clear error messages |
| Schema incompatibility with audit handler | Support both legacy and new schemas during transition |
| Notification handler missing required data | Enrich from DynamoDB, use sensible defaults |
| Cognito claims structure varies | Extract `sub` claim with defensive coding, log if missing |

---

## Deployment Considerations

1. **Backward Compatibility:** During transition, audit handler supports both schemas
2. **Rollback Plan:** If issues arise, handlers can be reverted without data loss
3. **Monitoring:** CloudWatch logs capture all event emission failures
4. **Environment Variables:** No longer used; all config from Parameter Store

---

## Appendix: Complete Event Schema Reference

### Standard Event Schema (New Handlers)

```json
{
  "Source": "cloudshop.{entity}",
  "DetailType": "{ActionType}Event",
  "Detail": {
    "userId": "string (Cognito sub)",
    "action": "string (ACTION_TYPE constant)",
    "timestamp": "string (ISO 8601)",
    "result": "string (SUCCESS or FAILURE)",
    "details": {
      "EntityId": "string",
      "AdditionalFields": "..."
    }
  }
}
```

### Order Event Schema (Existing)

```json
{
  "Source": "cloudshop.orders",
  "DetailType": "OrderCreated|OrderCancelled|OrderStatusChanged",
  "Detail": {
    "OrderId": "string",
    "CustomerId": "string",
    "Email": "string (for OrderCreated)",
    "StoreId": "string",
    "Total": "number (for OrderCreated)",
    "Status": "string",
    "PreviousStatus": "string (for status changes)",
    "NewStatus": "string",
    "CancelledBy": "string (for OrderCancelled)",
    "CancelledAt": "string (for OrderCancelled)",
    "UpdatedAt": "string (for OrderStatusChanged)"
  }
}
```
