# Vercel Deployment Guide

This guide covers the complete Vercel deployment setup for MAKU.Travel, including Git integration, multi-environment strategy, and best practices.

## Quick Start

### 1. Connect Repository to Vercel

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`

### 2. Environment Variables

Configure these environment variables in **Project Settings → Environment Variables**:

#### Production Environment
```bash
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_URL=your-production-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
AMADEUS_CLIENT_ID=your-production-amadeus-id
AMADEUS_CLIENT_SECRET=your-production-amadeus-secret
HOTELBEDS_API_KEY=your-production-hotelbeds-key
HOTELBEDS_API_SECRET=your-production-hotelbeds-secret
SABRE_CLIENT_ID=your-production-sabre-id
SABRE_CLIENT_SECRET=your-production-sabre-secret
STRIPE_SECRET_KEY=your-production-stripe-key
NODE_ENV=production
```

#### Staging Environment
```bash
VITE_SUPABASE_URL=your-staging-supabase-url
VITE_SUPABASE_ANON_KEY=your-staging-anon-key
# ... other staging environment variables
NODE_ENV=staging
```

### 3. GitHub Actions Setup

The repository includes automated deployment workflows in `.github/workflows/vercel-deploy.yml`.

**Required GitHub Secrets:**
- `VERCEL_TOKEN`: Your Vercel account token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

## Multi-Environment Strategy

### Production Deployment
- Triggered on `main` branch pushes
- Uses `vercel.json` configuration
- Includes security headers and optimization
- Requires manual approval via GitHub Environments

### Staging Deployment
- Triggered on `develop` branch pushes
- Uses `vercel.staging.json` configuration
- Includes staging-specific settings
- Automatic deployment after tests pass

### Preview Deployments
- Created for all pull requests
- Automatic deployment URL comments
- Uses preview environment variables
- Perfect for testing before merge

## Configuration Files

### vercel.json (Production)
- Optimized caching headers
- Security headers (CSP, HSTS, etc.)
- SPA routing configuration
- Health check cron jobs

### vercel.staging.json (Staging)
- Shorter cache times
- Staging-specific environment variables
- No-index robots directive
- Development-friendly settings

## Security Features

### Headers
- **Content Security Policy**: Prevents XSS attacks
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts API access

### Environment Protection
- Production deployments require approval
- Staging environments are protected
- Secrets are encrypted and scoped
- No secrets in build output validation

## Monitoring & Health Checks

### Automated Health Checks
- `/api/health-check` endpoint monitoring
- Cron-based health verification
- Deployment validation scripts
- Performance monitoring

### Deployment Validation
Run `scripts/validate-deployment.sh` to check:
- Required files presence
- Build output validation
- Configuration structure
- Security issue detection
- Bundle size analysis

## Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build locally
npm run build

# Validate configuration
node -e "console.log(require('./vercel.json'))"
```

#### 2. Environment Variable Issues
- Ensure all required variables are set
- Check variable scoping (Production/Preview/Development)
- Verify no typos in variable names

#### 3. Deployment Stuck
- Check Vercel dashboard for logs
- Verify GitHub Actions status
- Run deployment validation script

#### 4. Custom Domain Issues
- Verify DNS configuration
- Check domain verification status
- Ensure SSL certificate is active

### Debug Commands
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Pull environment configuration
vercel env pull

# Build locally with Vercel
vercel build

# Deploy to preview
vercel --prod=false

# Check deployment logs
vercel logs [deployment-url]
```

## Performance Optimization

### Asset Optimization
- Static assets cached for 1 year
- Gzip compression enabled
- Image optimization via Vercel
- Bundle size monitoring

### Edge Functions
- Australian region deployment (syd1)
- Serverless function optimization
- Cold start minimization
- Caching strategies

### Build Optimization
- Dependency caching
- Incremental builds
- Build artifact reuse
- Parallel processing

## Rollback Procedures

### Automatic Rollback
- Failed health checks trigger rollback
- GitHub Actions handle rollback
- Previous deployment restoration

### Manual Rollback
```bash
# Via Vercel CLI
vercel rollback --token=$VERCEL_TOKEN

# Via Vercel Dashboard
# Go to Deployments → Select previous deployment → Promote
```

## Best Practices

### Branch Strategy
- `main` → Production deployment
- `develop` → Staging deployment
- Feature branches → Preview deployments

### Testing Strategy
- Unit tests run before deployment
- Integration tests in staging
- Health checks post-deployment
- Performance monitoring

### Security Practices
- Regular dependency updates
- Secret rotation
- Access control reviews
- Security header validation

### Monitoring
- Deployment success/failure alerts
- Performance metric tracking
- Error rate monitoring
- User experience metrics

## Support

For deployment issues:
1. Check Vercel dashboard logs
2. Review GitHub Actions output
3. Run validation scripts
4. Consult this documentation
5. Contact the development team

Last updated: 2025-09-03