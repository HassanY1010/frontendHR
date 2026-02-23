# Production Deployment Checklist

## Environment Variables
Ensure the following variables are set in your production environment (e.g., Render, Vercel, Railway, Docker):

### Core
- `NODE_ENV=production`
- `PORT=4000` (or dynamic provided by host)
- `DATABASE_URL=mysql://user:pass@host:port/dbname`
- `API_URL=https://api.yourcomapny.com` (Used for generating dynamic links)

### Security
- `JWT_SECRET=super_long_random_string_min_64_chars`
- `ALLOWED_ORIGINS=https://app.yourcompany.com,https://admin.yourcompany.com`

### AI & Services
- `OPENAI_API_KEY=sk-...` (Ensure quota is active)
- `REDIS_URL=redis://user:pass@host:port` (Required for Queues & Caching)

## Essential Steps Before Launch

### 1. Database
- Run migrations: `npx prisma migrate deploy`
- Seed initial data (optional): `npx prisma db seed`

### 2. Infrastructure
- **Redis**: Required for BullMQ (Background Jobs) and Caching. Do not skip.
- **File Storage**: Currently using local storage (`/uploads`). For production (especially on serverless/ephemeral containers like Render/Heroku), you **MUST** configure an S3-compatible provider (AWS S3, Cloudflare R2) and update the `uploadResume` controller logic to use it.
- **SSL**: Ensure all domains are HTTPS.

### 3. Verification
- Use the `/health` endpoint to check status.
- Test the "Kill Switch" feature in `SystemSettings` if immediate shutdown is needed.
- Monitor `AuditLog` table for suspicious activity.

## AI Safety Considerations
- The AI service is configured to be **deterministic** (Temperature 0.3) and biased towards **safety**.
- All prompts require reasoning in **Arabic**.
- PII is scrubbed before being sent to OpenAI.

## Troubleshooting
- **AI Errors**: Check `AIUsageLog` table.
- **Login Issues**: Check `AuditLog` for `LOGIN_FAILED` events.
