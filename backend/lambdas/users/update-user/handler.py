import json
import boto3
import re
from botocore.exceptions import ClientError

ssm_client = boto3.client('ssm')
cognito_client = boto3.client('cognito-idp')

from event_emitter import emit_event

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
    """Only admins may update other users' accounts."""
    user_groups = claims.get("cognito:groups", "")
    if isinstance(user_groups, list):
        groups = {str(g).strip() for g in user_groups}
    else:
        groups = {g.strip() for g in str(user_groups).split(",") if g.strip()}
    return "admin" in groups


def lambda_handler(event, context):
    try:
        print("====== UPDATE USER REQUEST ======")

        # Get actor user_id and claims from the authenticated request
        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        actor_user_id = claims.get("sub", "SYSTEM")

        # Extract user_id from path parameters
        path_params = event.get('pathParameters') or {}
        target_user_id = path_params.get('user_id')

        if not target_user_id:
            return _response(400, {
                'message': 'User ID is required',
                'error': 'MISSING_USER_ID'
            })

        # Only admins can update other users. Users updating their own
        # profile are also allowed (self-service).
        if not _is_admin(claims) and actor_user_id != target_user_id:
            return _response(403, {
                'message': 'No autorizado para actualizar este usuario',
                'error': 'FORBIDDEN'
            })

        # Parse request body
        body = json.loads(event.get('body', '{}'))

        # Extract optional fields
        new_password = body.get('password')
        new_name = body.get('name')

        # Validate at least one field is provided
        if not new_password and not new_name:
            return _response(400, {
                'message': 'At least one field (password or name) must be provided',
                'error': 'NO_FIELDS_PROVIDED'
            })

        # Validate password if provided
        if new_password:
            if not is_valid_password(new_password):
                return _response(400, {
                    'message': 'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
                    'error': 'INVALID_PASSWORD_FORMAT'
                })

        # Validate name if provided
        if new_name:
            if not is_valid_name(new_name):
                return _response(400, {
                    'message': 'Name must be a non-empty string with maximum 100 characters',
                    'error': 'INVALID_NAME_FORMAT'
                })

        # Get User Pool ID
        user_pool_id = get_user_pool_id()

        # Verify user exists
        try:
            cognito_client.admin_get_user(
                UserPoolId=user_pool_id,
                Username=target_user_id
            )
        except ClientError as e:
            if e.response['Error']['Code'] == 'UserNotFoundException':
                return _response(404, {
                    'message': 'User not found',
                    'error': 'USER_NOT_FOUND'
                })
            raise

        # Update name if provided
        if new_name:
            cognito_client.admin_update_user_attributes(
                UserPoolId=user_pool_id,
                Username=target_user_id,
                UserAttributes=[
                    {'Name': 'name', 'Value': new_name}
                ]
            )
            print(f"Updated name for user: {target_user_id}")

        # Update password if provided
        if new_password:
            cognito_client.admin_set_user_password(
                UserPoolId=user_pool_id,
                Username=target_user_id,
                Password=new_password,
                Permanent=True
            )
            print(f"Updated password for user: {target_user_id}")

        # Emit audit event
        emit_event(
            user_id=actor_user_id,
            action="UPDATE_USER",
            result="SUCCESS",
            details={
                "TargetUserId": target_user_id,
                "UpdatedFields": {
                    "name": new_name is not None,
                    "password": new_password is not None
                }
            }
        )

        return _response(200, {
            'message': 'User updated successfully',
            'data': {
                'user_id': target_user_id,
                'updated_fields': {
                    'name': new_name is not None,
                    'password': new_password is not None
                }
            }
        })

    except ClientError as e:
        print(f'Cognito error: {str(e)}')
        return _response(500, {
            'message': 'Error updating user',
            'error': 'COGNITO_SERVICE_ERROR'
        })

    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return _response(500, {
            'message': 'Internal server error',
            'error': 'INTERNAL_ERROR'
        })
