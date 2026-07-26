# AWS Parameter Store and IAM Permissions Report

## Overview
This document lists all AWS Systems Manager (SSM) Parameter Store paths required by the backend Lambda functions, along with the necessary IAM permissions for each function to operate correctly.

---

## 1. Parameter Store Paths

### 1.1 Event Bridge Configuration
| Parameter Name | Description | Example Value | Used By |
| :--- | :--- | :--- | :--- |
| `/cloudshop/eventbus/name` | Name of the EventBridge Event Bus for audit and notification events | `cloudshop-audit-bus` | `utils/event_emitter.py`, Order handlers |

### 1.2 Cognito Configuration
| Parameter Name | Description | Example Value | Used By |
| :--- | :--- | :--- | :--- |
| `/app/cognito/user-pool-id` | AWS Cognito User Pool ID for user management operations | `us-east-1_AbCdEfGhI` | All User lambdas (`register-user`, `update-user`, `delete-user`, `get-users`) |

### 1.3 SES (Simple Email Service) Configuration
| Parameter Name | Description | Example Value | Used By |
| :--- | :--- | :--- | :--- |
| `/app/ses/order-template-name` | Name of the SES email template for order notifications | `OrderNotificationTemplate` | `notifications/send-order-notification` |
| `/app/ses/source-email` | Verified sender email address for SES | `noreply@cloudshop.com` | `notifications/send-order-notification` |

### 1.4 DynamoDB Table Names (Environment Variables)
*Note: These are currently configured as Environment Variables in Lambda, not SSM parameters. Consider migrating to SSM for consistency.*

| Variable Name | Description | Default Value | Used By |
| :--- | :--- | :--- | :--- |
| `PRODUCTS_TABLE_NAME` | Name of the Products DynamoDB table | `Products` | All Product lambdas |
| `STORES_TABLE_NAME` | Name of the Stores DynamoDB table | `Stores` | All Store lambdas |
| `CARTS_TABLE_NAME` | Name of the Carts DynamoDB table | `Carts` | All Cart lambdas |
| `ORDERS_TABLE_NAME` | Name of the Orders DynamoDB table | `Orders` | All Order lambdas |
| `AUDIT_TABLE_NAME` | Name of the Audit DynamoDB table | `Audit` | `events/audit_handler` |

---

## 2. IAM Permissions Required

Each Lambda execution role must have the following permissions based on the services they interact with.

### 2.1 Common Permissions (All Lambdas)
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
}
```

### 2.2 SSM Parameter Store Access
*Required by: User lambdas, Notification handler, Event emitter utility*

```json
{
    "Effect": "Allow",
    "Action": [
        "ssm:GetParameter"
    ],
    "Resource": [
        "arn:aws:ssm:*:*:parameter/cloudshop/eventbus/name",
        "arn:aws:ssm:*:*:parameter/app/cognito/user-pool-id",
        "arn:aws:ssm:*:*:parameter/app/ses/order-template-name",
        "arn:aws:ssm:*:*:parameter/app/ses/source-email"
    ]
}
```

### 2.3 EventBridge Put Events
*Required by: All mutation handlers (Products, Stores, Carts, Users, Orders)*

```json
{
    "Effect": "Allow",
    "Action": [
        "events:PutEvents"
    ],
    "Resource": "arn:aws:events:*:*:event-bus/*"
}
```
*Recommendation: Restrict to specific event bus ARN if known (e.g., `arn:aws:events:*:*:event-bus/cloudshop-audit-bus`)*

### 2.4 DynamoDB Access
*Required by: All data manipulation handlers (Products, Stores, Carts, Orders, Audit)*

```json
{
    "Effect": "Allow",
    "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
    ],
    "Resource": [
        "arn:aws:dynamodb:*:*:table/Products",
        "arn:aws:dynamodb:*:*:table/Stores",
        "arn:aws:dynamodb:*:*:table/Carts",
        "arn:aws:dynamodb:*:*:table/Orders",
        "arn:aws:dynamodb:*:*:table/Audit",
        "arn:aws:dynamodb:*:*:table/Products/index/*",
        "arn:aws:dynamodb:*:*:table/Stores/index/*",
        "arn:aws:dynamodb:*:*:table/Carts/index/*",
        "arn:aws:dynamodb:*:*:table/Orders/index/*",
        "arn:aws:dynamodb:*:*:table/Audit/index/*"
    ]
}
```
*Note: Replace table names with actual table names if different from defaults.*

### 2.5 Cognito Identity Provider Access
*Required by: User lambdas (`register-user`, `update-user`, `delete-user`, `get-users`)*

```json
{
    "Effect": "Allow",
    "Action": [
        "cognito-idp:AdminCreateUser",
        "cognito-idp:AdminUpdateUserAttributes",
        "cognito-idp:AdminDeleteUser",
        "cognito-idp:AdminGetUser",
        "cognito-idp:ListUsers"
    ],
    "Resource": "arn:aws:cognito-idp:*:*:userpool/*"
}
```
*Recommendation: Restrict to specific User Pool ARN if known.*

### 2.6 SES (Simple Email Service) Access
*Required by: `notifications/send-order-notification`*

```json
{
    "Effect": "Allow",
    "Action": [
        "ses:SendTemplatedEmail",
        "ses:GetTemplate"
    ],
    "Resource": "*"
}
```
*Recommendation: Restrict to specific template ARN if possible.*

---

## 3. Summary of Lambda-Specific Requirements

| Lambda Function | SSM Parameters | AWS Services | IAM Actions Needed |
| :--- | :--- | :--- | :--- |
| **Products** (CRUD) | `/cloudshop/eventbus/name` | DynamoDB, EventBridge | `dynamodb:*`, `events:PutEvents`, `ssm:GetParameter` |
| **Stores** (CRUD) | `/cloudshop/eventbus/name` | DynamoDB, EventBridge | `dynamodb:*`, `events:PutEvents`, `ssm:GetParameter` |
| **Carts** (Modify/Clear/Remove) | `/cloudshop/eventbus/name` | DynamoDB, EventBridge | `dynamodb:*`, `events:PutEvents`, `ssm:GetParameter` |
| **Users** (Register/Update/Delete/Get) | `/app/cognito/user-pool-id` | Cognito, SSM | `cognito-idp:*`, `ssm:GetParameter` |
| **Orders** (Create/Cancel/UpdateStatus) | `/cloudshop/eventbus/name` | DynamoDB, EventBridge | `dynamodb:*`, `events:PutEvents`, `ssm:GetParameter` |
| **Audit Handler** | None (uses ENV for table) | DynamoDB | `dynamodb:PutItem` |
| **Notification Handler** | `/app/ses/order-template-name`, `/app/ses/source-email` | SES, SSM, DynamoDB | `ses:SendTemplatedEmail`, `ses:GetTemplate`, `ssm:GetParameter`, `dynamodb:GetItem` |

---

## 4. Recommendations

1. **Migrate Environment Variables to SSM**: Consider moving DynamoDB table name configurations from environment variables to SSM Parameter Store for centralized management (e.g., `/cloudshop/dynamodb/products-table`).

2. **Least Privilege Principle**: 
   - Restrict EventBridge `PutEvents` to the specific event bus ARN.
   - Restrict Cognito actions to the specific User Pool ARN.
   - Restrict DynamoDB access to only the tables each lambda actually needs.

3. **Parameter Security**: If any parameters contain sensitive information (e.g., API keys, secrets), mark them as `SecureString` type in SSM and use `WithDecryption=True` when retrieving them.

4. **IAM Role Separation**: Create distinct IAM roles for different functional groups (e.g., one role for all data handlers, one for user management, one for notifications) to simplify permission management and auditing.
