# Spec Plan: AWS Lambda Handlers for User Management and Notifications

## Overview

This document specifies the implementation plan for 5 Python Lambda handlers that interact with AWS Cognito (user management) and AWS SES (notifications). The handlers will be invoked via API Gateway and designed to work with existing AWS infrastructure deployed via Terraform.

---

## Project Structure

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

tests/
├── users/
│   ├── test_register_user.py
│   ├── test_get_users.py
│   ├── test_update_user.py
│   └── test_delete_user.py
└── notifications/
    └── test_send_order_notification.py
```

---

## Common Requirements

### 1. Environment Variables (via AWS Systems Manager Parameter Store)

All handlers must retrieve the following resource names from Parameter Store:

| Parameter | Description | Example Path |
|-----------|-------------|--------------|
| `COGNITO_USER_POOL_ID` | Cognito User Pool ID | `/app/cognito/user-pool-id` |
| `SES_TEMPLATE_NAME` | SES Email Template Name | `/app/ses/order-template-name` |
| `SES_SOURCE_EMAIL` | Verified SES Sender Email | `/app/ses/source-email` |

**Implementation Pattern:**
```python
import boto3

ssm_client = boto3.client('ssm')

def get_parameter(param_name):
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']

# Placeholder paths - to be configured in Terraform
USER_POOL_ID_PARAM = '/app/cognito/user-pool-id'
```

### 2. Error Handling

- Use try-except blocks for all AWS service calls
- Log errors using `print()` statements (CloudWatch compatible)
- Return standardized HTTP-like status codes in responses
- Validate all input data before processing

### 3. Response Format

```python
# Success response
{
    "statusCode": 200,
    "body": {
        "message": "Success message",
        "data": { ... }
    }
}

# Error response
{
    "statusCode": 400,  # or 404, 500, etc.
    "body": {
        "message": "Error description",
        "error": "ERROR_CODE"
    }
}
```

### 4. Dependencies

- **Python Version:** 3.11 (latest stable)
- **External Dependencies:** Only `boto3` (included in Lambda runtime)
- **No additional packages required**

---

## Handler Specifications

### 1. Register User (`/users/register-user/handler.py`)

#### Purpose
Register a new user in AWS Cognito User Pool with default attributes.

#### Input (JSON Body)
```json
{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
}
```

#### Validation Rules
- `email`: Required, valid email format, must be unique in User Pool
- `password`: Required, minimum 8 characters, must contain uppercase, lowercase, number, and special character
- `name`: Required, non-empty string, max 100 characters

#### Default Attributes
- `custom:role`: `"client"`
- `custom:status`: `"active"`

#### Implementation Steps
1. Parse and validate input JSON
2. Retrieve `COGNITO_USER_POOL_ID` from Parameter Store
3. Call `admin_create_user` or `sign_up` Cognito API
4. Set user attributes (email, name, role, status)
5. Handle duplicate email errors
6. Return success with user ID or error response

#### Cognito API Method
```python
cognito_client.admin_create_user(
    UserPoolId=USER_POOL_ID,
    Username=email,
    UserAttributes=[
        {'Name': 'email', 'Value': email},
        {'Name': 'name', 'Value': name},
        {'Name': 'custom:role', 'Value': 'client'},
        {'Name': 'custom:status', 'Value': 'active'}
    ],
    MessageAction='SUPPRESS_DETAIL_MESSAGE'  # Avoid sending welcome email
)
```

#### Error Cases
- `400`: Invalid input (missing fields, invalid email/password format)
- `409`: User already exists
- `500`: Cognito service error

---

### 2. Get All Users (`/users/get-users/handler.py`)

#### Purpose
Retrieve all users from Cognito User Pool with optional filtering.

#### Input (Query Parameters)
```
GET /users?role=client&status=active
```

#### Optional Filters
- `role`: Filter by role attribute (e.g., "client", "admin")
- `status`: Filter by status attribute (e.g., "active", "inactive")

#### Implementation Steps
1. Parse query parameters for optional filters
2. Retrieve `COGNITO_USER_POOL_ID` from Parameter Store
3. Call `list_users` Cognito API
4. Apply client-side filtering if role/status filters provided
5. Extract relevant user attributes (email, name, role, status, created date)
6. Return paginated list (no pagination logic for v1, return all)

#### Cognito API Method
```python
cognito_client.list_users(
    UserPoolId=USER_POOL_ID,
    Filter='custom:status = "active"'  # Optional filter
)
```

#### Output Format
```json
{
    "statusCode": 200,
    "body": {
        "users": [
            {
                "id": "user-uuid",
                "email": "user@example.com",
                "name": "John Doe",
                "role": "client",
                "status": "active",
                "created_at": "2024-01-15T10:30:00Z"
            }
        ],
        "count": 1
    }
}
```

#### Error Cases
- `500`: Cognito service error

---

### 3. Update User (`/users/update-user/handler.py`)

#### Purpose
Partially update user information (only password and name allowed).

#### Input (JSON Body + Path Parameter)
```
PUT /users/{user_id}
{
    "password": "NewSecurePass456!",  # Optional
    "name": "Jane Doe"  # Optional
}
```

#### Validation Rules
- At least one field (`password` or `name`) must be provided
- `password`: If provided, must meet same requirements as registration
- `name`: If provided, must be non-empty string, max 100 characters
- Cannot modify: email, role, status

#### Implementation Steps
1. Extract `user_id` from path parameters
2. Parse and validate input JSON
3. Retrieve `COGNITO_USER_POOL_ID` from Parameter Store
4. Verify user exists using `admin_get_user`
5. Build attribute update list (only password and/or name)
6. Call `admin_update_user_attributes` Cognito API
7. For password updates, use `admin_set_user_password` separately
8. Return updated user data or error response

#### Cognito API Methods
```python
# For name update
cognito_client.admin_update_user_attributes(
    UserPoolId=USER_POOL_ID,
    Username=user_id,
    UserAttributes=[
        {'Name': 'name', 'Value': new_name}
    ]
)

# For password update
cognito_client.admin_set_user_password(
    UserPoolId=USER_POOL_ID,
    Username=user_id,
    Password=new_password,
    Permanent=True
)
```

#### Error Cases
- `400`: Invalid input (no fields provided, invalid format)
- `404`: User not found
- `500`: Cognito service error

---

### 4. Soft Delete User (`/users/delete-user/handler.py`)

#### Purpose
Deactivate a user by setting their status to "inactive" (soft delete).

#### Input (Path Parameter)
```
DELETE /users/{user_id}
```

#### Implementation Steps
1. Extract `user_id` from path parameters
2. Retrieve `COGNITO_USER_POOL_ID` from Parameter Store
3. Verify user exists and is currently active
4. Call `admin_update_user_attributes` to set `custom:status` to "inactive"
5. Do NOT disable the user account (keep it in Cognito)
6. Return success message or error response

#### Cognito API Method
```python
cognito_client.admin_update_user_attributes(
    UserPoolId=USER_POOL_ID,
    Username=user_id,
    UserAttributes=[
        {'Name': 'custom:status', 'Value': 'inactive'}
    ]
)
```

#### Output Format
```json
{
    "statusCode": 200,
    "body": {
        "message": "User successfully deactivated",
        "data": {
            "user_id": "user-uuid",
            "status": "inactive"
        }
    }
}
```

#### Error Cases
- `400`: User ID missing
- `404`: User not found
- `409`: User already inactive
- `500`: Cognito service error

---

### 5. Send Order Notification (`/notifications/send-order-notification/handler.py`)

#### Purpose
Send order confirmation/update notifications via AWS SES (email and push notification support).

#### Input (JSON Body)
```json
{
    "order_id": "ORD-12345",
    "customer_id": "CUST-67890",
    "customer_email": "customer@example.com",
    "items": [
        {"product_id": "PROD-001", "quantity": 2, "price": 29.99},
        {"product_id": "PROD-002", "quantity": 1, "price": 49.99}
    ],
    "status": "confirmed",
    "total": 109.97,
    "notification_type": "email"  # or "push"
}
```

#### Notification Types
- `email`: Send via AWS SES
- `push`: Plain text format prepared for push notification services (future integration)

#### Implementation Steps
1. Parse and validate input JSON
2. Retrieve `SES_TEMPLATE_NAME` and `SES_SOURCE_EMAIL` from Parameter Store
3. Validate order data (order_id, customer_email, items, status, total)
4. Format message content (plain text)
5. If `notification_type` is "email":
   - Call `send_templated_email` SES API
   - Include order details in template data
6. If `notification_type` is "push":
   - Format plain text message (prepare for future push service integration)
   - Log the message (no actual send for v1)
7. Return success or error response

#### SES API Method
```python
ses_client.send_templated_email(
    Source=SOURCE_EMAIL,
    Destination={
        'ToAddresses': [customer_email]
    },
    Template=TEMPLATE_NAME,
    TemplateData=json.dumps({
        'order_id': order_id,
        'customer_id': customer_id,
        'items': items,
        'status': status,
        'total': total
    })
)
```

#### Plain Text Template Format
```
Order Confirmation

Order ID: {order_id}
Customer ID: {customer_id}
Status: {status}
Total: ${total}

Items:
{for each item: - Product {product_id}: Qty {quantity} x ${price}}

Thank you for your purchase!
```

#### Error Cases
- `400`: Invalid input (missing required fields, invalid email format)
- `500`: SES service error

---

## Testing Strategy

### Test Location
All tests reside in the root-level `tests/` folder, organized by domain.

### Test Framework
- Use Python's built-in `unittest` module
- Mock AWS services using `unittest.mock` (no external dependencies)

### Test Coverage Requirements

Each handler must have unit tests covering:

1. **Happy Path**: Successful execution with valid input
2. **Validation Errors**: Missing/invalid input fields
3. **AWS Service Errors**: Mocked exceptions from Cognito/SES
4. **Edge Cases**: Empty inputs, special characters, boundary values

### Mocking Strategy

```python
from unittest.mock import Mock, patch
import boto3

@patch('boto3.client')
def test_register_user_success(self, mock_boto3):
    # Mock SSM client
    mock_ssm = Mock()
    mock_ssm.get_parameter.return_value = {
        'Parameter': {'Value': 'us-east-1_abc123'}
    }
    
    # Mock Cognito client
    mock_cognito = Mock()
    mock_cognito.admin_create_user.return_value = {
        'User': {'Username': 'user-uuid'}
    }
    
    mock_boto3.side_effect = lambda service: mock_ssm if service == 'ssm' else mock_cognito
    
    # Execute handler
    response = handler.lambda_handler(event, context)
    
    # Assertions
    assert response['statusCode'] == 200
```

### Test Files Structure

```
tests/
├── users/
│   ├── test_register_user.py
│   │   ├── TestRegisterUser::test_valid_registration
│   │   ├── TestRegisterUser::test_missing_email
│   │   ├── TestRegisterUser::test_invalid_password
│   │   ├── TestRegisterUser::test_duplicate_user
│   │   └── TestRegisterUser::test_cognito_error
│   ├── test_get_users.py
│   │   ├── TestGetUsers::test_get_all_users
│   │   ├── TestGetUsers::test_filter_by_role
│   │   ├── TestGetUsers::test_filter_by_status
│   │   └── TestGetUsers::test_cognito_error
│   ├── test_update_user.py
│   │   ├── TestUpdateUser::test_update_name
│   │   ├── TestUpdateUser::test_update_password
│   │   ├── TestUpdateUser::test_update_both_fields
│   │   ├── TestUpdateUser::test_no_fields_provided
│   │   ├── TestUpdateUser::test_user_not_found
│   │   └── TestUpdateUser::test_cognito_error
│   └── test_delete_user.py
│       ├── TestDeleteUser::test_soft_delete_success
│       ├── TestDeleteUser::test_user_not_found
│       ├── TestDeleteUser::test_already_inactive
│       └── TestDeleteUser::test_cognito_error
└── notifications/
    └── test_send_order_notification.py
        ├── TestSendOrderNotification::test_email_notification_success
        ├── TestSendOrderNotification::test_push_notification_format
        ├── TestSendOrderNotification::test_missing_order_id
        ├── TestSendOrderNotification::test_invalid_email
        └── TestSendOrderNotification::test_ses_error
```

---

## Implementation Checklist

### For Each Handler:

- [ ] Create handler file in appropriate folder
- [ ] Implement environment variable retrieval from Parameter Store (with placeholder paths)
- [ ] Add input validation logic
- [ ] Implement AWS service client initialization (Cognito/SES)
- [ ] Add main business logic
- [ ] Implement error handling with appropriate status codes
- [ ] Add print statements for CloudWatch logging
- [ ] Create corresponding unit test file
- [ ] Mock AWS services in tests
- [ ] Test happy path and all error scenarios

### Parameter Store Placeholders

All handlers must use these placeholder paths (to be replaced in Terraform):

```python
# Cognito
PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'

# SES
PARAM_SES_TEMPLATE = '/app/ses/order-template-name'
PARAM_SES_SOURCE_EMAIL = '/app/ses/source-email'
```

---

## Security Considerations

1. **Input Sanitization**: Validate and sanitize all user inputs
2. **Least Privilege**: Lambda execution roles should have minimal IAM permissions
3. **No Hardcoded Secrets**: All resource names retrieved from Parameter Store
4. **Password Handling**: Never log passwords or include them in responses
5. **Email Validation**: Verify email format before sending to SES

---

## Notes for Implementation

1. **No Terraform Code**: This spec covers only Python handler implementation
2. **Existing Infrastructure**: Assume Cognito User Pool, API Gateway, and SES templates exist
3. **KISS Principle**: Keep implementations simple, avoid over-engineering
4. **Print Logging**: Use `print()` for logs (CloudWatch integration handled by Terraform)
5. **No Retry Logic**: Failed SES sends should return error immediately
6. **Custom Attributes**: Cognito custom attributes (`custom:role`, `custom:status`) must be pre-defined in the User Pool

---

## Version Information

- **Spec Version:** 1.0
- **Python Version:** 3.11
- **Boto3 Version:** Latest (bundled with Lambda runtime)
- **API Version:** v1 (no pagination for get-users)
