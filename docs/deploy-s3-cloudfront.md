# S3 and CloudFront Deployment

Flint Admin is a Vite React SPA. Build output is static and can be hosted from S3 through CloudFront.

## Build

```bash
pnpm install
pnpm build
```

Upload the generated `dist/` directory to the admin frontend S3 bucket.

## Environment

Production builds should set:

```bash
VITE_ADMIN_API_BASE_URL=https://admin-api.flint.r-e.kr/api/v1
```

Local development can use the default `/api/v1` value and Vite will proxy `/api` to `http://localhost:8081`.

## CloudFront SPA fallback

The app uses clean URLs such as `/admin/overview`. Configure CloudFront custom error responses:

| Error | Response page path | HTTP response code | Error caching TTL |
| --- | --- | --- | --- |
| 403 | `/index.html` | 200 | 0 |
| 404 | `/index.html` | 200 | 0 |

This keeps client-side React Router routes working when a user refreshes a deep link.

## Cache policy

- `index.html`: `Cache-Control: no-cache, no-store, must-revalidate`
- `/assets/*`: `Cache-Control: public, max-age=31536000, immutable`

Vite emits hashed asset filenames, so long cache headers are safe for built assets. Keep `index.html` uncached so deploys pick up the latest asset manifest quickly.

## GitHub Actions deployment

The `release` branch deploys automatically through GitHub OIDC. Configure repository variables in `imflint/FLINT-Admin-Web`:

| Variable | Value |
| --- | --- |
| `AWS_FRONTEND_ROLE_ARN` | Terraform output `admin_frontend_github_actions_role_arn` |
| `ADMIN_FRONTEND_BUCKET` | Terraform output `admin_frontend_bucket` |
| `ADMIN_FRONTEND_DISTRIBUTION_ID` | Terraform output `admin_frontend_cloudfront_distribution_id` |
| `ADMIN_API_BASE_URL` | `https://admin-api.flint.r-e.kr/api/v1` |
