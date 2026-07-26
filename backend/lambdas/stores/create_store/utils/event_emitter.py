"""
Utility module for emitting events to EventBridge.
Used by all lambda handlers that need to emit audit/notification events.
"""
import json
import os
import boto3

# Parameter Store path for Event Bus Name (shared across all functions)
PARAM_EVENT_BUS_NAME = '/cloudshop/eventbus/name'

_events_client = None
_ssm_client = None


def _get_events_client():
    """Get or create Events client singleton."""
    global _events_client
    if _events_client is None:
        _events_client = boto3.client("events")
    return _events_client


def _get_ssm_client():
    """Get or create SSM client singleton."""
    global _ssm_client
    if _ssm_client is None:
        _ssm_client = boto3.client("ssm")
    return _ssm_client


def get_event_bus_name():
    """Retrieve Event Bus Name from AWS Systems Manager Parameter Store."""
    ssm_client = _get_ssm_client()
    response = ssm_client.get_parameter(Name=PARAM_EVENT_BUS_NAME, WithDecryption=False)
    return response['Parameter']['Value']


def emit_event(user_id, action, result="SUCCESS", details=None):
    """
    Emit an event to EventBridge with the standard schema.
    
    Args:
        user_id: The Cognito sub of the user performing the action
        action: The action type (e.g., "CREATE_PRODUCT", "DELETE_STORE")
        result: The result of the action (default: "SUCCESS")
        details: Optional dict with additional context data
    
    Returns:
        True if event was emitted successfully, False otherwise
    """
    from datetime import datetime
    
    if details is None:
        details = {}
    
    event_detail = {
        "userId": user_id,
        "timestamp": datetime.utcnow().isoformat(),
        "action": action,
        "result": result,
        "details": details
    }
    
    try:
        event_bus_name = get_event_bus_name()
        events_client = _get_events_client()
        
        events_client.put_events(
            Entries=[{
                'Source': 'cloudshop.audit',
                'DetailType': action,
                'Detail': json.dumps(event_detail),
                'EventBusName': event_bus_name
            }]
        )
        return True
    except Exception as e:
        print(f"ERROR emitting event: {str(e)}")
        return False


def emit_order_event(order_id, customer_id, detail_type, detail_data):
    """
    Emit an order-specific event to EventBridge.
    Used for order lifecycle events (OrderCreated, OrderCancelled, OrderStatusChanged).
    
    Args:
        order_id: The order ID
        customer_id: The customer ID (Cognito sub)
        detail_type: The event type (e.g., "OrderCreated", "OrderCancelled")
        detail_data: Dict with order-specific data
    
    Returns:
        True if event was emitted successfully, False otherwise
    """
    try:
        event_bus_name = get_event_bus_name()
        events_client = _get_events_client()
        
        events_client.put_events(
            Entries=[{
                'Source': 'cloudshop.orders',
                'DetailType': detail_type,
                'Detail': json.dumps(detail_data),
                'EventBusName': event_bus_name
            }]
        )
        return True
    except Exception as e:
        print(f"ERROR emitting order event: {str(e)}")
        return False
