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
    """Only admins may list all users."""
    user_groups = claims.get("cognito:groups", "")
    if isinstance(user_groups, list):
        groups = {str(g).strip() for g in user_groups}
    else:
        groups = {g.strip() for g in str(user_groups).split(",") if g.strip()}
    return "admin" in groups


def lambda_handler(event, context):
    try:
        print("====== GET USERS REQUEST ======")

        claims = event.get("requestContext", {}).get("authorizer", {}).get("claims", {})
        if not _is_admin(claims):
            return _response(403, {
                'message': 'No autorizado. Solo un administrador puede consultar usuarios',
                'error': 'FORBIDDEN'
            })

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

        return _response(200, {
            'message': 'Users retrieved successfully',
            'data': {
                'users': filtered_users,
                'count': len(filtered_users)
            }
        })

    except ClientError as e:
        print(f'Cognito error: {str(e)}')
        return _response(500, {
            'message': 'Error retrieving users',
            'error': 'COGNITO_SERVICE_ERROR'
        })

    except Exception as e:
        print(f'Unexpected error: {str(e)}')
        return _response(500, {
            'message': 'Internal server error',
            'error': 'INTERNAL_ERROR'
        })
