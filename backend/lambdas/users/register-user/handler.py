import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

# Import event emitter from utils
import sys
import os
from utils.event_emitter import emit_event

PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'
DEFAULT_GROUP_NAME = 'cliente'


def get_parameter(param_name):
    """Retrieve parameter value from AWS Systems Manager Parameter Store."""
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']


def get_user_pool_id():
    """Get Cognito User Pool ID from Parameter Store."""
    return get_parameter(PARAM_USER_POOL_ID)


def is_valid_email(email):
    """Validate email format using regex."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


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


def is_valid_name(name):
    """Validate name is non-empty and max 100 characters."""
    if not name or not isinstance(name, str):
        return False
    if name.strip() == "":
        return False
    if len(name) > 100:
        return False
    return True


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
        print("====== REGISTER USER REQUEST ======")

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Extract fields
        email = body.get('email')
        password = body.get('password')
        name = body.get('name')

        # Get user_id from claims (authenticated operation)
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        user_id = claims.get("sub", "SYSTEM")

        # Validate email presence and format
        if not email:
            return _response(400, {
                'message': 'Email is required',
                'error': 'MISSING_EMAIL'
            })

        if not is_valid_email(email):
            return _response(400, {
                'message': 'Invalid email format',
                'error': 'INVALID_EMAIL_FORMAT'
            })

        # Validate password presence and format
        if not password:
            return _response(400, {
                'message': 'Password is required',
                'error': 'MISSING_PASSWORD'
            })

        if not is_valid_password(password):
            return _response(400, {
                'message': 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
                'error': 'INVALID_PASSWORD_FORMAT'
            })

        # Validate name presence and format
        if not name:
            return _response(400, {
                'message': 'Name is required',
                'error': 'MISSING_NAME'
            })

        if not is_valid_name(name):
            return _response(400, {
                'message': 'Name must be a non-empty string with maximum 100 characters',
                'error': 'INVALID_NAME_FORMAT'
            })

        # Get User Pool ID
        user_pool_id = get_user_pool_id()

        # Create user in Cognito
        response = cognito_client.admin_create_user(
            UserPoolId=user_pool_id,
            Username=email,
            UserAttributes=[
                {'Name': 'email', 'Value': email},
                {'Name': 'email_verified', 'Value': 'true'},
                {'Name': 'name', 'Value': name},
                {'Name': 'custom:role', 'Value': 'client'},
                {'Name': 'custom:status', 'Value': 'active'}
            ],
            MessageAction='SUPPRESS'
        )

        user_id_created = response['User']['Username']

        # Set the user's chosen password as permanent so they can log in immediately
        cognito_client.admin_set_user_password(
            UserPoolId=user_pool_id,
            Username=user_id_created,
            Password=password,
            Permanent=True
        )

        # Assign the user to the default Cognito group so RBAC claims are populated
        cognito_client.admin_add_user_to_group(
            UserPoolId=user_pool_id,
            Username=user_id_created,
            GroupName=DEFAULT_GROUP_NAME
        )

        print(f"User registered successfully: {user_id_created}")

        # Emit audit event
        emit_event(
            user_id=user_id,
            action="REGISTER_USER",
            result="SUCCESS",
            details={
                "RegisteredUserId": user_id_created,
                "Email": email,
                "Name": name
            }
        )

        return _response(200, {
            'message': 'User registered successfully',
            'data': {
                'user_id': user_id_created,
                'email': email,
                'name': name
            }
        })

    except ClientError as e:
        error_code = e.response['Error']['Code']
        print(f'Cognito error: {error_code} - {str(e)}')

        if error_code == 'UsernameExistsException':
            return _response(409, {
                'message': 'User with this email already exists',
                'error': 'USER_ALREADY_EXISTS'
            })

        return _response(500, {
            'message': 'Error registering user',
            'error': 'COGNITO_SERVICE_ERROR'
        })

    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return _response(500, {
            'message': 'Internal server error',
            'error': 'INTERNAL_ERROR'
        })
