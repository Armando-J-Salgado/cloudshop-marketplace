# Implementation Plan: Automatic Frontend Build and Deploy

## Objective
Implement an automatic build and deployment process for the frontend application using Terraform, prioritizing efficiency and speed to meet the delivery deadline.

## Approach
Follow KISS (Keep It Simple, Stupid) and YAGNI (You Aren't Gonna Need It) principles. Focus on a quick, functional solution rather than a comprehensive long-term architecture.

## Solution Components

### 1. Environment Configuration
- Generate `.env.production` file containing Vite environment variables during Terraform apply
- Variables included:
  - `VITE_API_URL` - API Gateway invoke URL
  - `VITE_COGNITO_USER_POOL_ID` - Cognito User Pool ID
  - `VITE_COGNITO_CLIENT_ID` - Cognito Client ID
  - `VITE_AWS_REGION` - AWS Region

### 2. Frontend Build Process
- Execute `npm install && npm run build` using `null_resource` with local-exec provisioner
- Run build commands locally where Terraform is executed
- Trigger rebuild when environment file content changes (using sha256 hash trigger)

### 3. Asset Upload to S3
- Use `aws s3 sync` command via local-exec provisioner
- Sync built assets from `dist/` directory to target S3 bucket
- Use `--delete` flag to remove orphaned files from previous deployments
- No public ACL needed: bucket uses OAC (Origin Access Control) for CloudFront access

### 4. CloudFront Invalidation
- Trigger cache invalidation after successful S3 upload
- Use AWS CLI command to invalidate all paths (`/*`)
- Ensures users receive latest frontend version immediately

## Files Created/Modified

### New Module: `infraestructure/modules/frontend-deploy/`
- `variables.tf` - Input variables for the module
- `main.tf` - Resources for build and deploy process
- `outputs.tf` - Outputs (currently empty, reserved for future use)

### Modified Files
- `main.tf` - Added `frontend_deploy` module call
- `variables.tf` - Added optional `api_key` variable
- `frontend/.gitignore` - Added `.env*` files to ignore list

## Assumptions & Limitations

### Assumptions
- **Prerequisites**: Node.js, npm, and AWS CLI are installed on the machine running Terraform
- **Platform**: Works on any OS with bash/shell support (cross-platform compatible)
- **AWS Credentials**: Valid AWS credentials configured for the CLI

### Limitations (Accepted for Speed)
- Build runs locally during `terraform apply`, not in CI/CD pipeline
- No rollback mechanism if deployment fails
- `.env.production` file created locally (already gitignored)
- Full CloudFront invalidation (`/*`) on every deploy (simplest approach)

## Excluded Features (Future Considerations)
- CI/CD pipeline integration (GitHub Actions, etc.)
- Incremental/conditional builds
- Advanced error handling and retry logic
- Deployment notifications/alerts
- Blue-green or canary deployments

## Usage

```bash
# Standard terraform workflow
terraform init
terraform plan
terraform apply

# The module will automatically:
# 1. Generate .env.production with correct values
# 2. Run npm install && npm run build
# 3. Sync dist/ folder to S3 bucket
# 4. Invalidate CloudFront cache
```

## Estimated Timeline
~2-3 hours total (implementation + testing + buffer time)

## GitHub Actions Integration
To enable deployment by pushing to main branch:
- Add `actions/setup-node@v4` step to `.github/workflows/terraform.yml` before Terraform apply
- This ensures Node.js and npm are available on the GitHub Actions runner for the `null_resource` build process
- AWS CLI is already available in the runner environment with configured credentials

## Verification Steps
1. Run `terraform apply` and verify no errors
2. Check S3 bucket contains built files (index.html, assets/)
3. Access CloudFront URL and confirm frontend loads correctly
4. Verify API calls work with correct configuration
5. Test authentication flow with Cognito
