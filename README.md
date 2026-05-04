# Interview Assistant

A full-stack web application that helps generate interview questions, run live interviews with real-time marking, and produce candidate reports.

Live at **[interview-assistant.kotahirau.com](https://interview-assistant.kotahirau.com)**

---

## Architecture

```
frontend/         React + TypeScript + Vite + Material UI
backend/          AWS Lambda (Node 20, TypeScript)
infrastructure/   CloudFormation stacks
.github/          GitHub Actions CI/CD
```

### AWS resources (all cheap/serverless)

| Resource | Stack | Purpose |
|---|---|---|
| S3 | frontend | Static site hosting |
| CloudFront | frontend | CDN + HTTPS + custom domain |
| Route53 | frontend | `interview-assistant.kotahirau.com` |
| API Gateway HTTP API | backend | REST API for Lambda |
| Lambda (×3) | backend | sessions, questions, reports |
| DynamoDB (on-demand) | database | Sessions + reports |

---

## Local development

```bash
# Frontend
cd frontend
npm install
npm run dev         # http://localhost:5173

# Backend (local — optional, frontend uses mock AI by default)
cd backend
npm install
npm run build
```

The frontend runs **fully offline** using the mock AI service. Real AI calls only happen when `VITE_AI_API_URL` and `VITE_AI_API_KEY` are set.

---

## Environment variables

### Frontend (`.env.local`)

```
VITE_AI_API_URL=https://your-api-gateway-url
VITE_AI_API_KEY=your-api-key
```

### Lambda (set in CloudFormation parameters or AWS console)

```
DYNAMODB_TABLE=interview-assistant-prod
AI_API_URL=https://te-ihi.kotahirau.com
AI_API_KEY=<your-key>
CORS_ORIGIN=https://interview-assistant.kotahirau.com
```

---

## First-time AWS setup

### 1. Bootstrap stacks (run once)

```bash
# Create the OIDC role for GitHub Actions
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/iam-oidc.yml \
  --stack-name ia-oidc \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides GitHubOrg=limeng0427 GitHubRepo=interview-assistant

# Create the S3 bucket for Lambda packages
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/lambda-bucket.yml \
  --stack-name ia-lambda-bucket-prod
```

### 2. ACM certificate (must be in us-east-1 for CloudFront)

```bash
aws acm request-certificate \
  --domain-name interview-assistant.kotahirau.com \
  --validation-method DNS \
  --region us-east-1
```

Validate the certificate via Route53 DNS records, then copy the ARN.

### 3. GitHub Secrets

Add these secrets in **Settings → Secrets and variables → Actions**:

| Secret | Where to find |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | Output of `ia-oidc` stack |
| `FRONTEND_BUCKET_NAME` | Output of `ia-frontend-prod` stack |
| `CLOUDFRONT_DISTRIBUTION_ID` | Output of `ia-frontend-prod` stack |
| `LAMBDA_BUCKET_NAME` | Output of `ia-lambda-bucket-prod` stack |
| `ROUTE53_HOSTED_ZONE_ID` | Route53 → Hosted zones → kotahirau.com |
| `ACM_CERTIFICATE_ARN` | ACM console (us-east-1) |
| `AI_API_URL` | `https://te-ihi.kotahirau.com` |
| `AI_API_KEY` | Provided separately |
| `VITE_AI_API_URL` | Same as AI_API_URL (for frontend build) |
| `VITE_AI_API_KEY` | Same as AI_API_KEY |

### 4. Deploy infra stacks

Push to `main` — GitHub Actions deploys everything automatically.

---

## CI/CD pipeline

```
push to main
  ├── changes.frontend → build + S3 sync + CloudFront invalidation
  ├── changes.backend  → build + zip + S3 upload + Lambda update
  └── changes.infra    → CloudFormation deploy (database → backend → frontend)
```

PRs run type-check and build only (no deploy).

---

## Adding the real AI API

When you have the API key for `https://te-ihi.kotahirau.com`:

1. Add `AI_API_KEY` to GitHub Secrets
2. Add `VITE_AI_API_KEY` to GitHub Secrets  
3. Push to `main` — the frontend will automatically switch from mock to real AI

The abstraction layer is in `frontend/src/services/aiService.ts`. The backend proxy is in `backend/src/services/aiProxy.ts`.
