# Implementation Plan: AWS Lambda Handlers for User Management and Notifications

## Overview

This document provides a detailed, step-by-step implementation guide for creating 5 Python Lambda handlers that interact with AWS Cognito (user management) and AWS SES (notifications). Each section breaks down the exact code structure, validation logic, and error handling required.

---

## Project Structure

Create the following directory structure in the `backend/` folder:

```
backend/
├── users/
│   ├── register-user/
│   │   └── handler.py
│   ├── get-users/
│   │   └── handler.py
│   ├── update-user/
│   │   └── handler.py
│   └── delete-user/
│       └── handler.py
└── notifications/
    └── send-order-notification/
        └── handler.py
```

---

## Common Implementation Pattern

All handlers must follow this common pattern for retrieving parameters from AWS Systems Manager Parameter Store:

### Step 1: Import Required Modules
```python
import json
import boto3
import re
```

### Step 2: Initialize AWS Clients at Module Level
```python
ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')
ses_client = boto3.client('ses')
```

### Step 3: Define Parameter Store Paths
```python
PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'
PARAM_SES_TEMPLATE = '/app/ses/order-template-name'
PARAM_SES_SOURCE_EMAIL = '/app/ses/source-email'
```

### Step 4: Implement Parameter Retrieval Function
```python
def get_parameter(param_name):
    """Retrieve parameter value from AWS Systems Manager Parameter Store."""
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']
```

### Step 5: Implement Helper Function for User Pool ID
```python
def get_user_pool_id():
    """Get Cognito User Pool ID from Parameter Store."""
    return get_parameter(PARAM_USER_POOL_ID)
```

---

## Handler 1: Register User

**File:** `backend/users/register-user/handler.py`

### Step 1: Create File and Add Imports
Create the file and add:
```python
import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'
```

### Step 2: Implement Parameter Retrieval
```python
def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def get_user_pool_id():
    return get_parameter(PARAM_USER_POOL_ID)
```

### Step 3: Implement Email Validation Function
```python
def is_valid_email(email):
    """Validate email format using regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
```

### Step 4: Implement Password Validation Function
```python
def is_valid_password(password):
    """
    Validate password meets requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True
```

### Step 5: Implement Name Validation Function
```python
def is_valid_name(name):
    """Validate name is non-empty and max 100 characters."""
    if not name or not isinstance(name, str):
        return False
    if name.strip() == "":
        return False
    if len(name) > 100:
        return False
    return True
```

### Step 6: Implement Main Lambda Handler
```python
def lambda_handler(event, context):
    try:
        print("====== REGISTER USER REQUEST ======")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Extract fields
        email = body.get('email')
        password = body.get('password')
        name = body.get('name')
        
        # Validate email presence and format
        if not email:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Email is required',
                    'error': 'MISSING_EMAIL'
                }
            }
        
        if not is_valid_email(email):
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Invalid email format',
                    'error': 'INVALID_EMAIL_FORMAT'
                }
            }
        
        # Validate password presence and format
        if not password:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Password is required',
                    'error': 'MISSING_PASSWORD'
                }
            }
        
        if not is_valid_password(password):
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
                    'error': 'INVALID_PASSWORD_FORMAT'
                }
            }
        
        # Validate name presence and format
        if not name:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Name is required',
                    'error': 'MISSING_NAME'
                }
            }
        
        if not is_valid_name(name):
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Name must be a non-empty string with maximum 100 characters',
                    'error': 'INVALID_NAME_FORMAT'
                }
            }
        
        # Get User Pool ID
        user_pool_id = get_user_pool_id()
        
        # Create user in Cognito
        response = cognito_client.admin_create_user(
            UserPoolId=user_pool_id,
            Username=email,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'name', 'Value': name},
                {'Name': 'custom:role', 'Value': 'client'},
                {'Name': 'custom:status', 'Value': 'active'}
            ],
            MessageAction='SUPPRESS_DETAIL_MESSAGE'
        )
        
        user_id = response['User']['Username']
        
        print(f"User registered successfully: {user_id}")
        
        return {
            'statusCode': 200,
            'body': {
                'message': 'User registered successfully',
                'data': {
                    'user_id': user_id,
                    'email': email,
                    'name': name
                }
            }
        }
        
    except ClientError as e:
        error_code = e.response['Error']['Code']
        print(f'Cognito error: {error_code} - {str(e)}')
        
        if error_code == 'UsernameExistsException':
            return {
                'statusCode': 409,
                'body': {
                    'message': 'User with this email already exists',
                    'error': 'USER_ALREADY_EXISTS'
                }
            }
        
        return {
            'statusCode': 500,
            'body': {
                'message': 'Error registering user',
                'error': 'COGNITO_SERVICE_ERROR'
            }
        }
        
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Internal server error',
                'error': 'INTERNAL_ERROR'
            }
        }
```

---

## Handler 2: Get All Users

**File:** `backend/users/get-users/handler.py`

### Step 1: Create File and Add Imports
```python
import json
import boto3
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'
```

### Step 2: Implement Parameter Retrieval
```python
def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def get_user_pool_id():
    return get_parameter(PARAM_USER_POOL_ID)
```

### Step 3: Implement Attribute Extraction Helper
```python
def extract_user_attributes(user):
    """Extract relevant attributes from Cognito user object."""
    attributes = {}
    for attr in user.get('Attributes', []):
        name = attr.get('Name')
        value = attr.get('Value')
        if name == 'email':
            attributes['email'] = value
        elif name == 'name':
            attributes['name'] = value
        elif name == 'custom:role':
            attributes['role'] = value
        elif name == 'custom:status':
            attributes['status'] = value
    
    return attributes
```

### Step 4: Implement Main Lambda Handler
```python
def lambda_handler(event, context):
    try:
        print("====== GET USERS REQUEST ======")
        
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        role_filter = query_params.get('role')
        status_filter = query_params.get('status')
        
        # Get User Pool ID
        user_pool_id = get_user_pool_id()
        
        # Fetch all users with pagination support
        all_users = []
        next_token = None
        
        while True:
            if next_token:
                response = cognito_client.list_users(
                    UserPoolId=user_pool_id,
                    PaginationToken=next_token
                )
            else:
                response = cognito_client.list_users(UserPoolId=user_pool_id)
            
            users = response.get('Users', [])
            all_users.extend(users)
            
            next_token = response.get('PaginationToken')
            if not next_token:
                break
        
        # Process and filter users
        filtered_users = []
        for user in all_users:
            attrs = extract_user_attributes(user)
            
            # Apply role filter if provided
            if role_filter and attrs.get('role') != role_filter:
                continue
            
            # Apply status filter if provided
            if status_filter and attrs.get('status') != status_filter:
                continue
            
            # Build user object
            user_obj = {
                'id': user.get('Username'),
                'email': attrs.get('email', ''),
                'name': attrs.get('name', ''),
                'role': attrs.get('role', ''),
                'status': attrs.get('status', ''),
                'created_at': user.get('UserCreateDate').isoformat() if user.get('UserCreateDate') else ''
            }
            
            filtered_users.append(user_obj)
        
        print(f"Retrieved {len(filtered_users)} users")
        
        return {
            'statusCode': 200,
            'body': {
                'message': 'Users retrieved successfully',
                'data': {
                    'users': filtered_users,
                    'count': len(filtered_users)
                }
            }
        }
        
    except ClientError as e:
        print(f'Cognito error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Error retrieving users',
                'error': 'COGNITO_SERVICE_ERROR'
            }
        }
        
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Internal server error',
                'error': 'INTERNAL_ERROR'
            }
        }
```

---

## Handler 3: Update User

**File:** `backend/users/update-user/handler.py`

### Step 1: Create File and Add Imports
```python
import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'
```

### Step 2: Implement Parameter Retrieval
```python
def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def get_user_pool_id():
    return get_parameter(PARAM_USER_POOL_ID)
```

### Step 3: Implement Password Validation Function
```python
def is_valid_password(password):
    """Validate password meets requirements."""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'[0-9]', password):
        return False
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        return False
    return True
```

### Step 4: Implement Name Validation Function
```python
def is_valid_name(name):
    """Validate name is non-empty and max 100 characters."""
    if not name or not isinstance(name, str):
        return False
    if name.strip() == "":
        return False
    if len(name) > 100:
        return False
    return True
```

### Step 5: Implement Main Lambda Handler
```python
def lambda_handler(event, context):
    try:
        print("====== UPDATE USER REQUEST ======")
        
        # Extract user_id from path parameters
        path_params = event.get('pathParameters') or {}
        user_id = path_params.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'User ID is required',
                    'error': 'MISSING_USER_ID'
                }
            }
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Extract optional fields
        new_password = body.get('password')
        new_name = body.get('name')
        
        # Validate at least one field is provided
        if not new_password and not new_name:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'At least one field (password or name) must be provided',
                    'error': 'NO_FIELDS_PROVIDED'
                }
            }
        
        # Validate password if provided
        if new_password:
            if not is_valid_password(new_password):
                return {
                    'statusCode': 400,
                    'body': {
                        'message': 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
                        'error': 'INVALID_PASSWORD_FORMAT'
                    }
                }
        
        # Validate name if provided
        if new_name:
            if not is_valid_name(new_name):
                return {
                    'statusCode': 400,
                    'body': {
                        'message': 'Name must be a non-empty string with maximum 100 characters',
                        'error': 'INVALID_NAME_FORMAT'
                    }
                }
        
        # Get User Pool ID
        user_pool_id = get_user_pool_id()
        
        # Verify user exists
        try:
            cognito_client.admin_get_user(
                UserPoolId=user_pool_id,
                Username=user_id
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return {
                    'statusCode': 404,
                    'body': {
                        'message': 'User not found',
                        'error': 'USER_NOT_FOUND'
                    }
                }
            raise
        
        # Update name if provided
        if new_name:
            cognito_client.admin_update_user_attributes(
                UserPoolId=user_pool_id,
                Username=user_id,
                UserAttributes=[
                    {'Name': 'name', 'Value': new_name}
                ]
            )
            print(f"Updated name for user: {user_id}")
        
        # Update password if provided
        if new_password:
            cognito_client.admin_set_user_password(
                UserPoolId=user_pool_id,
                Username=user_id,
                Password=new_password,
                Permanent=True
            )
            print(f"Updated password for user: {user_id}")
        
        return {
            'statusCode': 200,
            'body': {
                'message': 'User updated successfully',
                'data': {
                    'user_id': user_id,
                    'updated_fields': {
                        'name': new_name is not None,
                        'password': new_password is not None
                    }
                }
            }
        }
        
    except ClientError as e:
        print(f'Cognito error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Error updating user',
                'error': 'COGNITO_SERVICE_ERROR'
            }
        }
        
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Internal server error',
                'error': 'INTERNAL_ERROR'
            }
        }
```

---

## Handler 4: Delete User (Soft Delete)

**File:** `backend/users/delete-user/handler.py`

### Step 1: Create File and Add Imports
```python
import json
import boto3
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'
```

### Step 2: Implement Parameter Retrieval
```python
def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def get_user_pool_id():
    return get_parameter(PARAM_USER_POOL_ID)
```

### Step 3: Implement Helper to Get User Status
```python
def get_user_status(user_pool_id, user_id):
    """Get current status of a user."""
    response = cognito_client.admin_get_user(
        UserPoolId=user_pool_id,
        Username=user_id
    )
    
    for attr in response.get('UserAttributes', []):
        if attr.get('Name') == 'custom:status':
            return attr.get('Value')
    
    return None
```

### Step 4: Implement Main Lambda Handler
```python
def lambda_handler(event, context):
    try:
        print("====== DELETE USER REQUEST ======")
        
        # Extract user_id from path parameters
        path_params = event.get('pathParameters') or {}
        user_id = path_params.get('user_id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'User ID is required',
                    'error': 'MISSING_USER_ID'
                }
            }
        
        # Get User Pool ID
        user_pool_id = get_user_pool_id()
        
        # Check if user exists and get current status
        try:
            current_status = get_user_status(user_pool_id, user_id)
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return {
                    'statusCode': 404,
                    'body': {
                        'message': 'User not found',
                        'error': 'USER_NOT_FOUND'
                    }
                }
            raise
        
        # Check if user is already inactive
        if current_status == 'inactive':
            return {
                'statusCode': 409,
                'body': {
                    'message': 'User is already inactive',
                    'error': 'USER_ALREADY_INACTIVE'
                }
            }
        
        # Perform soft delete by setting status to inactive
        cognito_client.admin_update_user_attributes(
            UserPoolId=user_pool_id,
            Username=user_id,
            UserAttributes=[
                {'Name': 'custom:status', 'Value': 'inactive'}
            ]
        )
        
        print(f"User deactivated successfully: {user_id}")
        
        return {
            'statusCode': 200,
            'body': {
                'message': 'User successfully deactivated',
                'data': {
                    'user_id': user_id,
                    'status': 'inactive'
                }
            }
        }
        
    except ClientError as e:
        print(f'Cognito error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Error deactivating user',
                'error': 'COGNITO_SERVICE_ERROR'
            }
        }
        
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Internal server error',
                'error': 'INTERNAL_ERROR'
            }
        }
```

---

## Handler 5: Send Order Notification

**File:** `backend/notifications/send-order-notification/handler.py`

### Step 1: Create File and Add Imports
```python
import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
ses_client = boto3.client('ses')

PARAM_SES_TEMPLATE = '/app/ses/order-template-name'
PARAM_SES_SOURCE_EMAIL = '/app/ses/source-email'
```

### Step 2: Implement Parameter Retrieval
```python
def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

def get_ses_template_name():
    return get_parameter(PARAM_SES_TEMPLATE)

def get_ses_source_email():
    return get_parameter(PARAM_SES_SOURCE_EMAIL)
```

### Step 3: Implement Email Validation Function
```python
def is_valid_email(email):
    """Validate email format using regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None
```

### Step 4: Implement Plain Text Message Formatter
```python
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
```

### Step 5: Implement Input Validation Function
```python
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
```

### Step 6: Implement Main Lambda Handler
```python
def lambda_handler(event, context):
    try:
        print("====== SEND ORDER NOTIFICATION REQUEST ======")
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate order data
        is_valid, error_message = validate_order_data(body)
        if not is_valid:
            return {
                'statusCode': 400,
                'body': {
                    'message': error_message,
                    'error': 'INVALID_INPUT'
                }
            }
        
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
            
            return {
                'statusCode': 200,
                'body': {
                    'message': 'Email notification sent successfully',
                    'data': {
                        'order_id': order_id,
                        'notification_type': 'email',
                        'recipient': customer_email
                    }
                }
            }
            
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
            
            return {
                'statusCode': 200,
                'body': {
                    'message': 'Push notification prepared successfully',
                    'data': {
                        'order_id': order_id,
                        'notification_type': 'push',
                        'message_preview': plain_text_message[:100] + '...'
                    }
                }
            }
            
        else:
            return {
                'statusCode': 400,
                'body': {
                    'message': 'Invalid notification type. Must be "email" or "push"',
                    'error': 'INVALID_NOTIFICATION_TYPE'
                }
            }
        
    except ClientError as e:
        print(f'SES error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Error sending notification',
                'error': 'SES_SERVICE_ERROR'
            }
        }
        
    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return {
            'statusCode': 500,
            'body': {
                'message': 'Internal server error',
                'error': 'INTERNAL_ERROR'
            }
        }
```

---

## Testing Strategy

### Test Directory Structure

Create the following test files in the `tests/` directory:

```
tests/
├── users/
│   ├── test_register_user.py
│   ├── test_get_users.py
│   ├── test_update_user.py
│   └── test_delete_user.py
└── notifications/
    └── test_send_order_notification.py
```

### Test Implementation Pattern

Each test file should follow this pattern:

#### Step 1: Import Required Modules
```python
import unittest
from unittest.mock import Mock, patch, MagicMock
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))
```

#### Step 2: Create Test Class with Setup
```python
class TestRegisterUser(unittest.TestCase):
    
    @patch('boto3.client')
    def setUp(self, mock_boto3):
        # Mock SSM client
        self.mock_ssm = Mock()
        self.mock_ssm.get_parameter.return_value = {
            'Parameter': {'Value': 'us-east-1_abc123'}
        }
        
        # Mock Cognito client
        self.mock_cognito = Mock()
        
        def side_effect(service):
            if service == 'ssm':
                return self.mock_ssm
            elif service == 'cognito-idp':
                return self.mock_cognito
            return Mock()
        
        mock_boto3.side_effect = side_effect
        
        # Import handler after mocking
        from backend.users.register_user import handler
        self.handler = handler
```

#### Step 3: Implement Happy Path Test
```python
    def test_valid_registration(self):
        # Mock successful Cognito response
        self.mock_cognito.admin_create_user.return_value = {
            'User': {'Username': 'test-user-id'}
        }
        
        # Create test event
        event = {
            'body': json.dumps({
                'email': 'test@example.com',
                'password': 'SecurePass123!',
                'name': 'Test User'
            })
        }
        
        # Execute handler
        response = self.handler.lambda_handler(event, None)
        
        # Assertions
        self.assertEqual(response['statusCode'], 200)
        self.assertEqual(response['body']['message'], 'User registered successfully')
        self.assertIn('user_id', response['body']['data'])
```

#### Step 4: Implement Validation Error Tests
```python
    def test_missing_email(self):
        event = {
            'body': json.dumps({
                'password': 'SecurePass123!',
                'name': 'Test User'
            })
        }
        
        response = self.handler.lambda_handler(event, None)
        
        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(response['body']['error'], 'MISSING_EMAIL')
    
    def test_invalid_password(self):
        event = {
            'body': json.dumps({
                'email': 'test@example.com',
                'password': 'weak',
                'name': 'Test User'
            })
        }
        
        response = self.handler.lambda_handler(event, None)
        
        self.assertEqual(response['statusCode'], 400)
        self.assertEqual(response['body']['error'], 'INVALID_PASSWORD_FORMAT')
```

#### Step 5: Implement AWS Service Error Tests
```python
    def test_duplicate_user(self):
        from botocore.exceptions import ClientError
        
        # Mock duplicate user error
        error_response = {
            'Error': {'Code': 'UsernameExistsException', 'Message': 'User already exists'}
        }
        self.mock_cognito.admin_create_user.side_effect = ClientError(
            error_response, 'admin_create_user'
        )
        
        event = {
            'body': json.dumps({
                'email': 'existing@example.com',
                'password': 'SecurePass123!',
                'name': 'Test User'
            })
        }
        
        response = self.handler.lambda_handler(event, None)
        
        self.assertEqual(response['statusCode'], 409)
        self.assertEqual(response['body']['error'], 'USER_ALREADY_EXISTS')
```

---

## Implementation Checklist

### For Each Handler:

- [ ] Create handler file in the correct directory
- [ ] Add imports (json, boto3, re, ClientError)
- [ ] Initialize AWS clients at module level
- [ ] Define Parameter Store paths
- [ ] Implement `get_parameter()` helper function
- [ ] Implement specific helper functions (validation, extraction, etc.)
- [ ] Implement `lambda_handler()` with:
  - [ ] Try-except block for error handling
  - [ ] Input parsing from event
  - [ ] Validation logic
  - [ ] AWS service calls
  - [ ] Success response with statusCode 200
  - [ ] Error responses with appropriate status codes (400, 404, 409, 500)
  - [ ] Print statements for CloudWatch logging
- [ ] Create corresponding test file
- [ ] Implement happy path test
- [ ] Implement validation error tests
- [ ] Implement AWS service error tests
- [ ] Implement edge case tests

### Parameter Store Configuration

Ensure these placeholder paths are configured in Terraform:

```python
# Cognito
'/app/cognito/user-pool-id'

# SES
'/app/ses/order-template-name'
'/app/ses/source-email'
```

---

## Key Decisions

### SES Notification Format Decision

For the `send-order-notification` handler, we decided to use **JSON TemplateData** for SES emails because:

1. **Flexibility**: SES templates can use Mustache syntax to dynamically format the JSON data
2. **Separation of Concerns**: Template design lives in SES console/CloudFormation, handler only sends data
3. **Reusability**: Same template can be used for different orders without code changes
4. **Best Practice**: AWS recommends using templates with TemplateData for transactional emails

For push notifications (future integration), we use **plain text format** because:
1. Push notification services typically expect simple text payloads
2. The formatted message can be easily adapted to Firebase, APNS, or other services
3. Logging the plain text allows for debugging and future service integration

### Pagination Implementation

The `get-users` handler implements full pagination logic using `PaginationToken` because:
1. Cognito's `list_users` API returns maximum 60 users per call
2. Without pagination handling, users beyond the first 60 would never be retrieved
3. The while loop continues until no `PaginationToken` is returned, ensuring all users are fetched
4. Filtering happens client-side after fetching all users, allowing flexible filter combinations

### Password Validation in Lambda

Password validation is implemented in the Lambda handler (not just Cognito) because:
1. Provides immediate feedback to users with specific error messages
2. Reduces unnecessary Cognito API calls for invalid passwords
3. Allows custom validation rules beyond Cognito's built-in policies
4. Consistent validation across registration and update operations

---

## Security Considerations

1. **Input Validation**: All inputs are validated before processing
2. **No Hardcoded Secrets**: All resource names retrieved from Parameter Store
3. **Password Handling**: Passwords are never logged or included in responses
4. **Least Privilege**: Lambda execution roles should have minimal IAM permissions:
   - SSM: `ssm:GetParameter` on specific paths
   - Cognito: Only required admin actions on specific user pool
   - SES: `ses:SendTemplatedEmail` only
5. **Email Validation**: Email format verified before sending to SES/Cognito

---

## Version Information

- **Plan Version:** 1.0
- **Python Version:** 3.11
- **Boto3 Version:** Latest (bundled with Lambda runtime)
- **API Version:** v1
