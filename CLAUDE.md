# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + MUI v5, deployed to S3/CloudFront
- **Backend**: AWS Lambda (Node.js 20) + TypeScript, behind API Gateway HTTP API
- **Database**: DynamoDB single-table design (PK=`SESSION#<id>`, SK=`METADATA|REPORT`)
- **Auth**: Cognito User Pool with Google SSO + email; PKCE flow (no Amplify SDK)
- **AI**: Te Ihi gateway (`https://te-ihi.kotahirau.com/`) proxying to Claude; SSE streaming collected server-side
- **IaC**: CloudFormation YAML in `infrastructure/cloudformation/`
- **CI/CD**: GitHub Actions OIDC (keyless), triggered on push to `main`

## Commands

```bash
# Frontend dev
cd frontend && npm install && npm run dev      # http://localhost:5173
npm run type-check                             # TypeScript check (no emit)
npm run build                                  # Vite production build → dist/

# Backend
cd backend && npm install
npm run type-check                             # TypeScript check
npm run bundle                                 # esbuild bundle → dist/ + lambda.zip
```

## Deploy Order (first time)

```bash
aws cloudformation deploy --template-file infrastructure/cloudformation/lambda-bucket.yml --stack-name ia-lambda-bucket-prod ...
aws cloudformation deploy --template-file infrastructure/cloudformation/iam-oidc.yml      --stack-name ia-oidc-prod ...
aws cloudformation deploy --template-file infrastructure/cloudformation/auth.yml          --stack-name ia-auth-prod ...
aws cloudformation deploy --template-file infrastructure/cloudformation/database.yml      --stack-name ia-database-prod ...
aws cloudformation deploy --template-file infrastructure/cloudformation/backend.yml       --stack-name ia-backend-prod ...
aws cloudformation deploy --template-file infrastructure/cloudformation/frontend.yml      --stack-name ia-frontend-prod ...
```

After auth stack: add the Cognito domain callback URLs to the Google OAuth app.
After backend stack: capture the API Gateway URL from stack output → set `VITE_AI_API_URL` + `AI_API_URL` secrets.
After frontend stack: add CloudFront URL to Google OAuth allowed origins.

## GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN from iam-oidc stack output |
| `FRONTEND_BUCKET_NAME` | S3 bucket from frontend stack |
| `LAMBDA_BUCKET_NAME` | S3 bucket from lambda-bucket stack |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront distribution ID |
| `ROUTE53_HOSTED_ZONE_ID` | Hosted zone for `kotahirau.com` |
| `ACM_CERTIFICATE_ARN` | ACM cert (must be in `us-east-1`) |
| `AI_API_URL` | Te Ihi URL (for Lambda env) |
| `AI_API_KEY` | Te Ihi key (for Lambda env) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `VITE_AI_API_URL` | API Gateway URL (for frontend build) |
| `VITE_COGNITO_USER_POOL_ID` | Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | Cognito Client ID |
| `VITE_COGNITO_DOMAIN` | Cognito domain (e.g. `ia-auth-prod-123.auth.ap-southeast-2.amazoncognito.com`) |

## Architecture Notes

**Single-table DynamoDB**: Sessions and reports share one table.
- `PK=SESSION#<id>, SK=METADATA` → session record (includes questions array, userId)
- `PK=SESSION#<id>, SK=REPORT` → report record
- `TypeIndex` GSI: `type + updatedAt` (dev/unauthenticated listing)
- `UserIndex` GSI: `userId + updatedAt` (production user-scoped listing)

**Auth flow**: PKCE → Cognito Hosted UI → code exchange → idToken stored in localStorage. API Gateway JWT authorizer validates tokens; Lambda reads `userId` from `event.requestContext.authorizer.jwt.claims.sub`.

**AI flow**: Frontend calls `POST /questions` (backend Lambda) → Lambda calls Te Ihi SSE stream → collects full content → returns typed JSON.

**Frontend state**: React Context + useReducer (`interviewStore.tsx`). Writes to localStorage synchronously; fires backend sync (fire-and-forget) in parallel.

**Local dev without auth**: Set `VITE_AI_API_URL` to `''` (or unset) — app uses `mockAiService` and `storageService` (localStorage only), no backend calls.
