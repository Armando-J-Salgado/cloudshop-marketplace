import json
import boto3
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

# Import event emitter from utils
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'utils'))
from event_emitter import emit_event

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


def _is_admin(claims):
    """Only admins may deactivate user accounts."""
    user_groups = claims.get("cognito:groups", "")
    if isinstance(user_groups, list):
        groups = {str(g).strip() for g in user_groups}
    else:
        groups = {g.strip() for g in str(user_groups).split(",") if g.strip()}
    return "admin" in groups


def lambda_handler(event, context):
    try:
        print("====== DELETE USER REQUEST ======")

        # Get actor user_id and claims from the authenticated request
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        actor_user_id = claims.get("sub", "SYSTEM")

        if not _is_admin(claims):
            return _response(403, {
                'message': 'No autorizado. Solo un administrador puede desactivar usuarios',
                'error': 'FORBIDDEN'
            })

        # Extract user_id from path parameters
        path_params = event.get('pathParameters') or {}
        target_user_id = path_params.get('user_id')

        if not target_user_id:
            return _response(400, {
                'message': 'User ID is required',
                'error': 'MISSING_USER_ID'
            })

        # Get User Pool ID
        user_pool_id = get_user_pool_id()

        # Check if user exists and get current status
        try:
            current_status = get_user_status(user_pool_id, target_user_id)
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return _response(404, {
                    'message': 'User not found',
                    'error': 'USER_NOT_FOUND'
                })
            raise

        # Check if user is already inactive
        if current_status == 'inactive':
            return _response(409, {
                'message': 'User is already inactive',
                'error': 'USER_ALREADY_INACTIVE'
            })

        # Perform soft delete by setting status to inactive
        cognito_client.admin_update_user_attributes(
            UserPoolId=user_pool_id,
            Username=target_user_id,
            UserAttributes=[
                {'Name': 'custom:status', 'Value': 'inactive'}
            ]
        )

        print(f"User deactivated successfully: {target_user_id}")

        # Emit audit event
        emit_event(
            user_id=actor_user_id,
            action="DELETE_USER",
            result="SUCCESS",
            details={
                "TargetUserId": target_user_id,
                "NewStatus": "inactive"
            }
        )

        return _response(200, {
            'message': 'User successfully deactivated',
            'data': {
                'user_id': target_user_id,
                'status': 'inactive'
            }
        })

    except ClientError as e:
        print(f'Cognito error: {str(e)}')
        return _response(500, {
            'message': 'Error deactivating user',
            'error': 'COGNITO_SERVICE_ERROR'
        })

    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return _response(500, {
            'message': 'Internal server error',
            'error': 'INTERNAL_ERROR'
        })
