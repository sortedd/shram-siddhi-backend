# Vercel Backend Deployment Guide

## Environment Variables

When deploying to Vercel, you need to set the following environment variables in your Vercel project settings:

1. `JWT_SECRET` - A secure random string for JWT token signing
2. `SUPABASE_URL` - Your Supabase project URL
3. `SUPABASE_KEY` - Your Supabase anon key
4. `FRONTEND_URL` - Your frontend Vercel deployment URL (e.g., https://your-frontend.vercel.app)

## How to Set Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your backend project
3. Go to Settings > Environment Variables
4. Add each variable with the appropriate values
5. Redeploy your project for changes to take effect

## Important Notes

- Never commit sensitive environment variables to your repository
- In Vercel, the PORT variable is automatically set by the platform
- NODE_ENV is automatically set to "production" in Vercel