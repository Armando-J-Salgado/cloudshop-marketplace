import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

PARAM_USER_POOL_ID = '/app/cognito/user-pool-id'


def get_parameter(param_name):
    """Retrieve parameter value from AWS Systems Manager Parameter Store."""
    response = ssm_client.get_parameter(Name=param_name, WithDecryption=False)
    return response['Parameter']['Value']


def get_user_pool_id():
    """Get Cognito User Pool ID from Parameter Store."""
    return get_parameter(PARAM_USER_POOL_ID)


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


def is_valid_name(name):
    """Validate name is non-empty and max 100 characters."""
    if not name or not isinstance(name, str):
        return False
    if name.strip() == "":
        return False
    if len(name) > 100:
        return False
    return True


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
