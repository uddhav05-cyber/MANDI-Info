# Implementation Plan: Production Deployment

## Overview

This implementation plan provides step-by-step tasks for deploying the Multilingual Mandi application to production on mandiinfo.in using only free-tier services. The deployment follows a sequential approach: infrastructure setup, service configuration, deployment automation, verification, and monitoring. Each task is designed to be completed independently while building on previous work.

## Tasks

- [ ] 1. Pre-deployment preparation and configuration
  - [x] 1.1 Create production environment configuration file
    - Create `.env.production.example` with all required environment variables
    - Document each variable's purpose and where to obtain values
    - Add validation script to check required variables are set
    - _Requirements: 7.1, 7.2, 7.3, 15.2_

  - [ ] 1.2 Update backend to support email-based OTP
    - Replace Twilio SMS service with email SMTP service
    - Create email template for OTP delivery
    - Configure nodemailer or similar library for SMTP
    - Add fallback error handling if email fails
    - _Requirements: 16.1, 16.4_

  - [ ] 1.3 Add LibreTranslate integration
    - Replace Google Cloud Translation API with LibreTranslate client
    - Add LibreTranslate URL configuration
    - Implement fallback to cached translations if service unavailable
    - Update translation service to use LibreTranslate API
    - _Requirements: 16.2, 16.4_

  - [ ] 1.4 Add TensorFlow.js for image recognition
    - Replace Google Cloud Vision API with TensorFlow.js
    - Load pre-trained MobileNet model
    - Implement image classification function
    - Add confidence threshold filtering
    - _Requirements: 16.3, 16.4_

  - [ ] 1.5 Create deployment documentation
    - Write DEPLOYMENT.md with step-by-step instructions
    - Document all environment variables in .env.production.example
    - Create ARCHITECTURE.md with system overview
    - Create RUNBOOK.md with troubleshooting steps
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 2. Database setup and migration
  - [ ] 2.1 Create Neon.tech database
    - Sign up for Neon.tech account (no credit card required)
    - Create new PostgreSQL database in US East region
    - Enable SSL mode and connection pooling
    - Copy connection string for environment variables
    - Test connection from local machine
    - _Requirements: 3.1, 3.2_

  - [ ] 2.2 Configure database connection for production
    - Update database configuration to use SSL
    - Set connection pool max to 20 (free-tier limit)
    - Configure connection timeout and idle timeout
    - Add connection retry logic with exponential backoff
    - _Requirements: 3.2, 3.5, 12.5_

  - [ ] 2.3 Prepare database migrations for production
    - Review all migration files for production readiness
    - Ensure migrations are idempotent
    - Test migrations on fresh database
    - Create rollback scripts for each migration
    - _Requirements: 3.3_

  - [ ] 2.4 Create database seeding script
    - Write seed script for product categories
    - Add common products to seed data
    - Make seeding idempotent (check before insert)
    - Add logging for all seeding operations
    - Test seeding multiple times to verify idempotency
    - _Requirements: 17.1, 17.3, 17.4, 17.5_

- [ ] 3. Redis cache setup
  - [ ] 3.1 Create Upstash Redis instance
    - Sign up for Upstash account (no credit card required)
    - Create new Redis database in US East region
    - Enable TLS connection
    - Configure eviction policy to allkeys-lru
    - Copy connection string (rediss://) for environment variables
    - Test connection from local machine
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ] 3.2 Configure Redis client for production
    - Update Redis configuration to use TLS (rediss://)
    - Enable connection pooling with appropriate limits
    - Add connection retry logic
    - Implement graceful degradation if Redis unavailable
    - Add Redis connection health check
    - _Requirements: 4.2, 4.3, 4.4_

- [ ] 4. Backend deployment configuration
  - [ ] 4.1 Create production build configuration
    - Update tsconfig.json for production builds
    - Configure build script to output to dist/ directory
    - Add source maps for debugging
    - Optimize build for production (minification, tree shaking)
    - _Requirements: 1.2_

  - [ ] 4.2 Create health check endpoint
    - Implement GET /api/health endpoint
    - Check database connectivity in health check
    - Check Redis connectivity in health check
    - Return service status and uptime information
    - Log health check failures
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ] 4.3 Add production security middleware
    - Configure helmet.js for security headers
    - Set up CORS with frontend domain whitelist
    - Implement rate limiting middleware (100 req/min per IP)
    - Add request ID middleware for logging
    - Configure HTTPS enforcement
    - _Requirements: 12.1, 12.2, 12.3, 10.5, 6.3_

  - [ ] 4.4 Configure Sentry error tracking for backend
    - Sign up for Sentry account (no credit card required)
    - Create new project for backend
    - Install @sentry/node package
    - Initialize Sentry in backend entry point
    - Configure error filtering and sampling
    - Test error capture
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ] 4.5 Add environment variable validation
    - Create validation function for required env vars
    - Check all required variables on startup
    - Fail fast with clear error message if missing
    - Log loaded configuration (without sensitive values)
    - _Requirements: 7.2, 7.3, 7.5_

- [ ] 5. Deploy backend to Render.com
  - [ ] 5.1 Create Render.com account and service
    - Sign up for Render.com account (no credit card required)
    - Connect GitHub repository
    - Create new Web Service
    - Select Node.js environment
    - Configure service region (US East)
    - _Requirements: 2.1_

  - [ ] 5.2 Configure Render.com build and start commands
    - Set build command: `npm run build --workspace=backend`
    - Set start command: `npm run migrate && npm start --workspace=backend`
    - Configure Node.js version (18.x or higher)
    - Set health check path to /api/health
    - Enable auto-deploy on main branch push
    - _Requirements: 2.3, 2.5, 8.1, 8.2, 8.4_

  - [ ] 5.3 Configure environment variables in Render
    - Add all required environment variables in Render dashboard
    - Set NODE_ENV=production
    - Add DATABASE_URL from Neon
    - Add REDIS_URL from Upstash
    - Generate and add JWT_SECRET
    - Add SMTP credentials
    - Add SENTRY_DSN
    - _Requirements: 2.6, 7.1, 7.2, 7.3_

  - [ ] 5.4 Deploy backend and verify
    - Trigger initial deployment
    - Monitor build logs for errors
    - Verify deployment successful
    - Test health check endpoint
    - Verify database connection
    - Verify Redis connection
    - _Requirements: 2.2, 9.1, 9.2_

  - [ ] 5.5 Configure custom domain for backend
    - Add custom domain api.mandiinfo.in in Render
    - Copy CNAME record value
    - Wait for SSL certificate provisioning
    - Verify HTTPS access
    - _Requirements: 5.2, 6.1, 6.3_

- [ ] 6. Frontend deployment configuration
  - [ ] 6.1 Update frontend environment configuration
    - Create .env.production file
    - Set VITE_API_URL=https://api.mandiinfo.in
    - Add VITE_SENTRY_DSN for error tracking
    - Update API client to use production URL
    - _Requirements: 7.1, 7.2_

  - [ ] 6.2 Optimize frontend build
    - Configure Vite for production optimization
    - Enable code splitting by route
    - Configure lazy loading for images
    - Enable compression (gzip/brotli)
    - Optimize bundle size
    - _Requirements: 1.2, 11.3, 11.4_

  - [ ] 6.3 Configure service worker for offline support
    - Verify service worker is properly configured
    - Test offline functionality locally
    - Configure cache strategies for different asset types
    - Add offline fallback page
    - _Requirements: 11.5_

  - [ ] 6.4 Configure Sentry error tracking for frontend
    - Create new Sentry project for frontend
    - Install @sentry/react package
    - Initialize Sentry in frontend entry point
    - Configure error filtering and sampling
    - Test error capture
    - _Requirements: 10.1, 10.2, 10.4_

- [ ] 7. Deploy frontend to Vercel
  - [ ] 7.1 Create Vercel account and project
    - Sign up for Vercel account (no credit card required)
    - Import GitHub repository
    - Select frontend workspace (packages/frontend)
    - Configure project settings
    - _Requirements: 1.1_

  - [ ] 7.2 Configure Vercel build settings
    - Set root directory to packages/frontend
    - Set build command: `npm run build --workspace=frontend`
    - Set output directory: dist
    - Configure Node.js version (18.x or higher)
    - Enable auto-deploy on main branch push
    - _Requirements: 1.2, 1.4, 8.1, 8.2_

  - [ ] 7.3 Configure environment variables in Vercel
    - Add VITE_API_URL=https://api.mandiinfo.in
    - Add VITE_SENTRY_DSN
    - Verify environment variables are loaded
    - _Requirements: 7.1, 7.2_

  - [ ] 7.4 Deploy frontend and verify
    - Trigger initial deployment
    - Monitor build logs for errors
    - Verify deployment successful
    - Test frontend loads correctly
    - Verify API calls work
    - _Requirements: 1.3_

  - [ ] 7.5 Configure custom domain for frontend
    - Add custom domain mandiinfo.in in Vercel
    - Add www.mandiinfo.in as alias
    - Copy DNS record values (A and CNAME)
    - Wait for SSL certificate provisioning
    - Verify HTTPS access
    - _Requirements: 5.1, 5.4, 6.1, 6.3_

- [ ] 8. DNS configuration
  - [ ] 8.1 Configure DNS records at domain registrar
    - Log in to domain registrar (where mandiinfo.in is registered)
    - Add A record for @ pointing to Vercel IP (76.76.21.21)
    - Add CNAME record for www pointing to cname.vercel-dns.com
    - Add CNAME record for api pointing to Render service URL
    - Set TTL to 3600 seconds (1 hour)
    - _Requirements: 5.1, 5.2, 5.4_

  - [ ] 8.2 Verify DNS propagation
    - Wait for DNS propagation (up to 24 hours)
    - Use DNS checker tools to verify records
    - Test domain resolution from multiple locations
    - Verify both www and non-www work
    - Verify api subdomain works
    - _Requirements: 5.3_

  - [ ] 8.3 Verify HTTPS and redirects
    - Test HTTP to HTTPS redirect for frontend
    - Test HTTP to HTTPS redirect for backend
    - Verify SSL certificates are valid
    - Test www to non-www redirect (or vice versa)
    - _Requirements: 5.5, 6.3, 6.4_

- [ ] 9. Deploy LibreTranslate service
  - [ ] 9.1 Create LibreTranslate deployment on Render
    - Create new Web Service on Render for LibreTranslate
    - Use Docker image: libretranslate/libretranslate
    - Configure environment variables for supported languages
    - Set health check endpoint
    - Deploy service
    - _Requirements: 16.2_

  - [ ] 9.2 Configure backend to use LibreTranslate
    - Update translation service to use LibreTranslate URL
    - Add LibreTranslate URL to backend environment variables
    - Test translation functionality
    - Verify caching works correctly
    - _Requirements: 16.2_

- [ ] 10. Post-deployment verification
  - [ ] 10.1 Run infrastructure verification tests
    - Verify frontend accessible at https://mandiinfo.in
    - Verify backend accessible at https://api.mandiinfo.in
    - Verify SSL certificates valid and not expired
    - Verify DNS records configured correctly
    - Verify health check returns healthy status
    - _Requirements: 1.3, 2.2, 6.3, 9.1_

  - [ ] 10.2 Run configuration verification tests
    - Verify NODE_ENV is "production"
    - Verify database connection uses SSL
    - Verify Redis connection uses TLS
    - Verify all migrations applied
    - Verify connection pool limits configured
    - _Requirements: 2.6, 3.2, 3.3, 3.5, 12.5_

  - [ ] 10.3 Run security verification tests
    - Verify HTTPS enforced (HTTP redirects)
    - Verify TLS 1.2+ enforced
    - Verify security headers present
    - Verify CORS configured correctly
    - Verify rate limiting enforced
    - Verify .env files not in Git
    - _Requirements: 5.5, 6.4, 12.1, 12.2, 12.3, 7.4_

  - [ ] 10.4 Run functional verification tests
    - Test user registration flow
    - Test OTP email delivery
    - Test product listing
    - Test translation functionality
    - Test image recognition
    - Test WhatsApp sharing
    - Test offline functionality
    - _Requirements: All functional requirements_

  - [ ] 10.5 Run performance verification tests
    - Run Lighthouse performance test (target score > 80)
    - Verify compression enabled
    - Verify cache headers set correctly
    - Verify service worker registered
    - Test load time on simulated 3G network
    - _Requirements: 11.1, 11.2, 11.3, 11.5, 1.3_

- [ ] 11. Monitoring and alerting setup
  - [ ] 11.1 Configure uptime monitoring
    - Sign up for UptimeRobot (free tier)
    - Add monitor for https://mandiinfo.in
    - Add monitor for https://api.mandiinfo.in/api/health
    - Configure alert notifications (email)
    - Set check interval to 5 minutes
    - _Requirements: 9.3_

  - [ ] 11.2 Set up cold start mitigation
    - Sign up for cron-job.org (free)
    - Create cron job to ping health endpoint every 14 minutes
    - Verify backend stays warm
    - Monitor cold start occurrences
    - _Requirements: 2.4_

  - [ ] 11.3 Configure resource usage monitoring
    - Set up monitoring for Vercel bandwidth usage
    - Set up monitoring for Render compute hours
    - Set up monitoring for Neon storage and compute
    - Set up monitoring for Upstash commands and storage
    - Set up monitoring for Sentry error count
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ] 11.4 Create monitoring dashboard
    - Document how to check each service's usage
    - Create checklist for daily monitoring tasks
    - Set up alerts for 80% of free-tier limits
    - Document escalation procedures
    - _Requirements: 14.4, 14.5_

- [ ] 12. Backup and recovery setup
  - [ ] 12.1 Configure database backups
    - Verify Neon automatic backups are enabled
    - Document backup retention period (7 days)
    - Create manual backup script using pg_dump
    - Test backup script
    - Store backup script in repository
    - _Requirements: 18.1, 18.2_

  - [ ] 12.2 Test backup restoration
    - Create test database
    - Restore from Neon backup
    - Verify data integrity
    - Document restoration procedure
    - Time the restoration process
    - _Requirements: 18.3, 18.4_

  - [ ] 12.3 Document rollback procedures
    - Document how to rollback frontend in Vercel
    - Document how to rollback backend in Render
    - Document how to rollback database migrations
    - Create rollback checklist
    - Test rollback procedure in staging
    - _Requirements: 13.2, 13.3, 13.5_

- [ ] 13. Final documentation and handoff
  - [ ] 13.1 Complete deployment documentation
    - Finalize DEPLOYMENT.md with all steps
    - Add screenshots for each service setup
    - Document common issues and solutions
    - Add links to all service dashboards
    - _Requirements: 15.1_

  - [ ] 13.2 Complete environment variables documentation
    - Document all environment variables in .env.production.example
    - Add descriptions and example values
    - Document which services require which variables
    - Add validation checklist
    - _Requirements: 15.2, 16.5_

  - [ ] 13.3 Complete architecture documentation
    - Finalize ARCHITECTURE.md with diagrams
    - Document all services and their interactions
    - Add service limits and constraints
    - Document scaling considerations
    - _Requirements: 15.1_

  - [ ] 13.4 Complete runbook documentation
    - Finalize RUNBOOK.md with troubleshooting steps
    - Add common issues and solutions
    - Document emergency procedures
    - Add contact information for support
    - _Requirements: 15.4, 15.5_

  - [ ] 13.5 Create cost management documentation
    - Document free-tier limits for all services
    - Create monitoring checklist
    - Document optimization strategies
    - Add scaling recommendations
    - _Requirements: 14.5_

- [ ] 14. Final checkpoint - Production ready
  - Ensure all verification tests pass
  - Ensure monitoring is active
  - Ensure documentation is complete
  - Ask the user if any questions arise before going live

## Notes

- All tasks use only free-tier services with no credit card required
- Tasks are ordered to minimize dependencies and allow parallel work where possible
- Each task includes specific requirements references for traceability
- Deployment can be completed within 4 days by following tasks sequentially
- Some tasks can be done in parallel (e.g., database setup and Redis setup)
- All services provide automatic SSL/TLS certificates
- Cold start mitigation is critical for Render.com free tier
- Comprehensive monitoring ensures early detection of issues
- Documentation is essential for maintenance and troubleshooting
- Backup and rollback procedures ensure quick recovery from issues
