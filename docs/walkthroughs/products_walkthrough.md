# Walkthrough: Products Lambdas

## Overview

This document provides a walkthrough of the implementation for the Products management Lambdas within the CloudShop Enterprise architecture. All files were created in their respective directories under `/backend/lambdas/products/`. 

The implementation adheres to the project's security rules (admin-only endpoints) and DynamoDB access patterns (PK = StoreId, SK = ProductId), alongside best practices derived from existing services.

## Created Files

### 1. Create Product
**Path**: [`backend/lambdas/products/create_product/lambda_function.py`](file:///c:/Users/lcluz/Desktop/cloudshop-marketplace/backend/lambdas/products/create_product/lambda_function.py)
- **Endpoint mapping**: `POST /products`
- **Description**: Validates that all required product fields are provided (`StoreId`, `Code`, `Name`, `Description`, `Category`, `Price`, `Stock`). It generates a unique UUID for the new product, sets its `Status` to `"ACTIVE"`, and applies timestamps (`CreatedAt`, `UpdatedAt`).
- **Security**: Validates that the caller has `admin` or `operator` permissions via Cognito claims.

### 2. Get Products (With Pagination)
**Path**: [`backend/lambdas/products/get_products/lambda_function.py`](file:///c:/Users/lcluz/Desktop/cloudshop-marketplace/backend/lambdas/products/get_products/lambda_function.py)
- **Endpoint mapping**: `GET /products`
- **Description**: Handles fetching a list of products. Supports DynamoDB pagination through `limit` and base64 encoded `next_token` query parameters.
- **Access Patterns**: 
  - If a `store_id` is provided in the query string, it performs an efficient `query` against the Partition Key.
  - If no `store_id` is provided, it falls back to a `scan` to list products globally.

### 3. Get Product By ID
**Path**: [`backend/lambdas/products/get_product_by_id/lambda_function.py`](file:///c:/Users/lcluz/Desktop/cloudshop-marketplace/backend/lambdas/products/get_product_by_id/lambda_function.py)
- **Endpoint mapping**: `GET /products/{id}`
- **Description**: Retrieves a single product. 
- **Access Patterns**: 
  - If `store_id` is passed as a query string parameter, it performs a highly efficient `get_item`.
  - If `store_id` is omitted, it performs a `scan` over the table with a `FilterExpression` matching the `ProductId`.

### 4. Update Product
**Path**: [`backend/lambdas/products/update_product/lambda_function.py`](file:///c:/Users/lcluz/Desktop/cloudshop-marketplace/backend/lambdas/products/update_product/lambda_function.py)
- **Endpoint mapping**: `PATCH /products/{id}`
- **Description**: Safely updates fields of an existing product dynamically based on the provided JSON body. It relies on the `update_item` API and automatically updates the `UpdatedAt` timestamp. 
- **Security**: Ensures the caller has `admin` or `operator` permissions.

### 5. Delete Product (Soft Delete)
**Path**: [`backend/lambdas/products/delete_product/lambda_function.py`](file:///c:/Users/lcluz/Desktop/cloudshop-marketplace/backend/lambdas/products/delete_product/lambda_function.py)
- **Endpoint mapping**: `DELETE /products/{id}`
- **Description**: Implements the soft delete approach per standard best practices. It updates the `Status` of the product to `"INACTIVE"`, rather than erasing the item from DynamoDB, preserving history for orders that reference this product.
- **Security**: Ensures the caller has `admin` or `operator` permissions.

## Next Steps for Validation

1. Verify that your API Gateway and Terraform configurations point to these new handlers correctly.
2. Ensure you have the `admin` group correctly mapped in your Cognito user pool to test the restricted endpoints.
3. Test pagination by passing `?limit=2` to the `GET /products` endpoint to observe the generation and usage of `next_token`.
