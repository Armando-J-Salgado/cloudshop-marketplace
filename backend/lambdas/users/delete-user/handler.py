import json
import boto3
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
