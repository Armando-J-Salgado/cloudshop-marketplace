import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
ses_client = boto3.client('ses')

PARAM_SES_TEMPLATE = '/app/ses/order-template-name'
PARAM_SES_SOURCE_EMAIL = '/app/ses/source-email'


def get_parameter(param_name):
    """Retrieve parameter value from AWS Systems Manager Parameter Store."""
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']


def get_ses_template_name():
    """Get SES template name from Parameter Store."""
    return get_parameter(PARAM_SES_TEMPLATE)


def get_ses_source_email():
    """Get SES source email from Parameter Store."""
    return get_parameter(PARAM_SES_SOURCE_EMAIL)


def is_valid_email(email):
    """Validate email format using regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def format_plain_text_message(order_data):
    """
    Format order data as plain text message.
    This format is suitable for both email body and push notification preparation.
    """
    items_text = ""
    for item in order_data.get('items', []):
        items_text += f"- Product {item.get('product_id')}: Qty {item.get('quantity')} x ${item.get('price')}\n"

    message = f"""Order Confirmation

Order ID: {order_data.get('order_id')}
Customer ID: {order_data.get('customer_id')}
Status: {order_data.get('status')}
Total: ${order_data.get('total')}

Items:
{items_text}
Thank you for your purchase!"""

    return message


def validate_order_data(body):
    """Validate required order fields are present."""
    required_fields = ['order_id', 'customer_id', 'customer_email', 'items', 'status', 'total']

    for field in required_fields:
        if field not in body:
            return False, f'Missing required field: {field}'

    if not is_valid_email(body.get('customer_email')):
        return False, 'Invalid customer email format'

    if not isinstance(body.get('items'), list) or len(body.get('items')) == 0:
        return False, 'Items must be a non-empty array'

    return True, None


def _response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PATCH,DELETE'
        },
        'body': json.dumps(body)
    }


def lambda_handler(event, context):
    try:
        print("====== SEND ORDER NOTIFICATION REQUEST ======")

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Validate order data
        is_valid, error_message = validate_order_data(body)
        if not is_valid:
            return _response(400, {
                'message': error_message,
                'error': 'INVALID_INPUT'
            })

        # Extract order data
        order_id = body.get('order_id')
        customer_id = body.get('customer_id')
        customer_email = body.get('customer_email')
        items = body.get('items')
        status = body.get('status')
        total = body.get('total')
        notification_type = body.get('notification_type', 'email')

        # Get SES configuration
        template_name = get_ses_template_name()
        source_email = get_ses_source_email()

        # Handle based on notification type
        if notification_type == 'email':
            # Prepare template data for SES
            template_data = {
                'order_id': order_id,
                'customer_id': customer_id,
                'items': items,
                'status': status,
                'total': total
            }

            # Send templated email via SES
            ses_client.send_templated_email(
                Source=source_email,
                Destination={
                    'ToAddresses': [customer_email]
                },
                Template=template_name,
                TemplateData=json.dumps(template_data)
            )

            print(f"Email notification sent for order: {order_id}")

            return _response(200, {
                'message': 'Email notification sent successfully',
                'data': {
                    'order_id': order_id,
                    'notification_type': 'email',
                    'recipient': customer_email
                }
            })

        elif notification_type == 'push':
            # Format plain text message for push notification
            order_data = {
                'order_id': order_id,
                'customer_id': customer_id,
                'items': items,
                'status': status,
                'total': total
            }

            plain_text_message = format_plain_text_message(order_data)

            # Log the message (future push service integration)
            print(f"Push notification prepared for order: {order_id}")
            print(f"Message content:\n{plain_text_message}")

            return _response(200, {
                'message': 'Push notification prepared successfully',
                'data': {
                    'order_id': order_id,
                    'notification_type': 'push',
                    'message_preview': plain_text_message[:100] + '...'
                }
            })

        else:
            return _response(400, {
                'message': 'Invalid notification type. Must be "email" or "push"',
                'error': 'INVALID_NOTIFICATION_TYPE'
            })

    except ClientError as e:
        print(f'SES error: {str(e)}')
        return _response(500, {
            'message': 'Error sending notification',
            'error': 'SES_SERVICE_ERROR'
        })

    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return _response(500, {
            'message': 'Internal server error',
            'error': 'INTERNAL_ERROR'
        })
