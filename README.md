# PaniniMarketing

Partnership Hub - Content Management and Approval System

## Deployment

### Required Environment Variables

Before deploying to Vercel or any other platform, configure these environment variables:

#### Supabase Configuration (Required)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

#### Optional Configuration
- `NEXT_PUBLIC_APP_URL` - Your application URL (defaults to http://localhost:3000)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` - Email configuration (if using email features)

### Vercel Deployment

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the required environment variables in Vercel project settings
4. Deploy

See `.env.example` for a complete list of environment variables and their descriptions.

## Development

1. Copy `.env.example` to `.env.local`
2. Fill in your environment variables
3. Run `npm install`
4. Run `npm run dev`
