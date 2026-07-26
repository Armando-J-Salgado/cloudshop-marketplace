# Implementation Plan: Products Lambdas

## Goal Description
Create five lambdas for managing products in the `/backend/lambdas/products/` directory in Python:
1. **Create Product** (`POST /products`)
2. **Get Products** (`GET /products` with pagination)
3. **Get Product By ID** (`GET /products/{id}`)
4. **Update Product** (`PATCH /products/{id}`)
5. **Delete Product** (`DELETE /products/{id}`)

This plan adheres to the existing architecture of the CloudShop project, utilizing AWS SDK (`boto3`) and DynamoDB, and mimicking the structure found in the `orders` and `carts` modules.



## Proposed Changes

### Backend / Lambdas / Products

#### [NEW] backend/lambdas/products/create_product/lambda_function.py
- Validates the payload to ensure all required fields are present (`StoreId`, `Code`, `Name`, `Description`, `Category`, `Price`, `Stock`).
- Validates that the caller has `admin` permissions.
- Generates a UUID for the `ProductId`.
- Adds `Status = "ACTIVE"`, `CreatedAt`, and `UpdatedAt` timestamps.
- Performs a `put_item` into the `Products` table.

#### [NEW] backend/lambdas/products/get_products/lambda_function.py
- Retrieves query parameters for pagination: `limit` (default 20) and `next_token` (ExclusiveStartKey).
- Retrieves an optional `store_id` filter from the query string.
- If `store_id` is provided, performs a `query()` on the `Products` table using the PK.
- If `store_id` is missing, performs a `scan()` on the `Products` table.
- Returns a list of products and a base64 encoded `next_token` if more items are available.

#### [NEW] backend/lambdas/products/get_product_by_id/lambda_function.py
- Retrieves the `id` from path parameters (`ProductId`).
- Retrieves `store_id` from query parameters.
- If `store_id` is provided, uses `get_item(Key={"StoreId": store_id, "ProductId": product_id})` for an efficient read.
- If `store_id` is missing, uses `scan(FilterExpression=Attr("ProductId").eq(product_id))` to locate the product.

#### [NEW] backend/lambdas/products/update_product/lambda_function.py
- Validates that the caller has `admin` permissions.
- Retrieves the `id` from path parameters (`ProductId`).
- Parses the request body for `StoreId` and the fields to be updated.
- Dynamically constructs the `UpdateExpression` based on the provided fields.
- Performs an `update_item` operation on the DynamoDB table.

#### [NEW] backend/lambdas/products/delete_product/lambda_function.py
- Validates that the caller has `admin` permissions.
- Retrieves the `id` from path parameters (`ProductId`) and `store_id` from query parameters.
- Performs a soft delete by updating the `Status` field to `"INACTIVE"` via an `update_item` operation on the DynamoDB table.

## Verification Plan

### Automated / Code Verification
- Review the implemented lambdas to ensure they match the style, error handling (`_response` helper), and standard AWS SDK (`boto3`) implementations seen in `backend/lambdas/orders/`.
- Ensure Decimal encoding is handled correctly during serialization.

### Manual Verification
- The resulting lambdas should be reviewed by the user to ensure alignment with terraform scripts and API Gateway configuration.
- The `products_walkthrough.md` will be created with step-by-step documentation detailing the structure and function of the code to aid your manual testing in the AWS environment.
