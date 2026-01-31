# Requirements Document: Production Deployment

## Introduction

This document outlines the requirements for deploying the Multilingual Mandi web application to production on the domain mandiinfo.in by February 2nd, 2026. The deployment must be completed with zero budget constraints, utilizing only free-tier hosting services and infrastructure. The application is a monorepo containing a React frontend, Node.js/Express backend, PostgreSQL database, and Redis caching layer.

## Glossary

- **System**: The complete Multilingual Mandi application deployment infrastructure
- **Frontend**: The React-based user interface application
- **Backend**: The Node.js/Express API server
- **Database**: The PostgreSQL relational database
- **Cache**: The Redis in-memory data store
- **Domain**: The mandiinfo.in domain name
- **Hosting_Provider**: The free-tier cloud service hosting the application components
- **SSL_Certificate**: The TLS/SSL certificate for HTTPS encryption
- **Environment_Variables**: Configuration values for production deployment
- **Build_Artifact**: The compiled production-ready code
- **DNS_Record**: Domain Name System configuration entries
- **Health_Check**: Automated endpoint monitoring for service availability
- **Rollback**: The process of reverting to a previous working deployment

## Requirements

### Requirement 1: Frontend Hosting

**User Story:** As a user, I want to access the Multilingual Mandi web application through a fast and reliable static hosting service, so that I can use the application without performance issues.

#### Acceptance Criteria

1. THE System SHALL host the Frontend on a free-tier static hosting service (Vercel, Netlify, Cloudflare Pages, or GitHub Pages)
2. WHEN the Frontend is built, THE System SHALL generate optimized Build_Artifacts with code splitting and minification
3. WHEN a user accesses the domain, THE System SHALL serve the Frontend with a response time under 2 seconds on 3G networks
4. THE System SHALL configure automatic deployments from the main branch
5. THE System SHALL enable gzip or brotli compression for all static assets

### Requirement 2: Backend API Hosting

**User Story:** As a developer, I want to deploy the Backend API on a free-tier platform, so that the Frontend can communicate with the server without incurring costs.

#### Acceptance Criteria

1. THE System SHALL host the Backend on a free-tier platform (Render.com, Railway.app, or Fly.io)
2. WHEN the Backend starts, THE System SHALL expose all API endpoints on HTTPS
3. THE System SHALL configure the Backend to start automatically after deployment
4. WHEN the Backend receives requests, THE System SHALL respond within 5 seconds under normal load
5. THE System SHALL configure automatic deployments from the main branch
6. THE System SHALL set the NODE_ENV environment variable to "production"

### Requirement 3: Database Hosting

**User Story:** As a system administrator, I want to host the PostgreSQL Database on a free-tier service, so that application data persists without incurring costs.

#### Acceptance Criteria

1. THE System SHALL host the Database on a free-tier PostgreSQL service (Neon.tech, Supabase, or ElephantSQL)
2. WHEN the Database is provisioned, THE System SHALL provide a connection string with SSL enabled
3. THE System SHALL run all database migrations before the Backend starts
4. THE System SHALL configure automatic backups if available on the free tier
5. THE System SHALL limit database connections to stay within free-tier limits (typically 20 concurrent connections)

### Requirement 4: Redis Cache Hosting

**User Story:** As a developer, I want to deploy Redis for caching on a free-tier service, so that the application can cache translations and session data without costs.

#### Acceptance Criteria

1. THE System SHALL host the Cache on a free-tier Redis service (Upstash or Redis Cloud)
2. WHEN the Cache is provisioned, THE System SHALL provide a connection string with TLS enabled
3. THE System SHALL configure the Backend to connect to the Cache with connection pooling
4. IF the Cache is unavailable, THEN THE Backend SHALL continue operating with degraded performance
5. THE System SHALL configure cache eviction policies appropriate for the free-tier memory limits

### Requirement 5: Domain Configuration

**User Story:** As a user, I want to access the application at mandiinfo.in, so that I can easily remember and share the application URL.

#### Acceptance Criteria

1. THE System SHALL configure DNS_Records to point mandiinfo.in to the Frontend hosting service
2. THE System SHALL configure DNS_Records to point api.mandiinfo.in to the Backend hosting service
3. WHEN DNS_Records are updated, THE System SHALL propagate changes within 24 hours
4. THE System SHALL configure both www and non-www versions of the domain
5. THE System SHALL redirect HTTP traffic to HTTPS

### Requirement 6: SSL/TLS Certificates

**User Story:** As a user, I want all connections to be encrypted with HTTPS, so that my data is secure during transmission.

#### Acceptance Criteria

1. THE System SHALL provision SSL_Certificates using Let's Encrypt or the Hosting_Provider's free certificate service
2. WHEN SSL_Certificates are provisioned, THE System SHALL configure automatic renewal
3. THE System SHALL enforce HTTPS for all Frontend and Backend connections
4. THE System SHALL configure TLS 1.2 or higher as the minimum protocol version
5. WHEN SSL_Certificates expire within 30 days, THE System SHALL automatically renew them

### Requirement 7: Environment Configuration

**User Story:** As a developer, I want to configure production Environment_Variables securely, so that sensitive credentials are not exposed in the codebase.

#### Acceptance Criteria

1. THE System SHALL store all Environment_Variables in the Hosting_Provider's secure configuration system
2. WHEN the Backend starts, THE System SHALL load Environment_Variables from the hosting platform
3. THE System SHALL configure DATABASE_URL, REDIS_URL, JWT_SECRET, and API keys as Environment_Variables
4. THE System SHALL NOT include Environment_Variables in the Git repository
5. THE System SHALL validate required Environment_Variables on Backend startup and fail fast if missing

### Requirement 8: Build and Deployment Pipeline

**User Story:** As a developer, I want automated deployments when code is pushed to the main branch, so that updates are deployed quickly without manual intervention.

#### Acceptance Criteria

1. WHEN code is pushed to the main branch, THE System SHALL trigger automatic builds for Frontend and Backend
2. WHEN builds complete successfully, THE System SHALL deploy the new Build_Artifacts automatically
3. IF a build fails, THEN THE System SHALL prevent deployment and notify the developer
4. THE System SHALL run database migrations as part of the Backend deployment process
5. THE System SHALL complete deployments within 10 minutes of code push

### Requirement 9: Health Monitoring

**User Story:** As a system administrator, I want to monitor the health of deployed services, so that I can detect and respond to outages quickly.

#### Acceptance Criteria

1. THE Backend SHALL expose a Health_Check endpoint at /api/health
2. WHEN the Health_Check endpoint is called, THE System SHALL verify Database and Cache connectivity
3. THE System SHALL configure the Hosting_Provider to monitor the Health_Check endpoint
4. IF the Health_Check fails three consecutive times, THEN THE System SHALL restart the Backend service
5. THE System SHALL log all Health_Check failures for debugging

### Requirement 10: Error Tracking and Logging

**User Story:** As a developer, I want to track errors and logs in production, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. THE System SHALL integrate a free-tier error tracking service (Sentry, LogRocket, or similar)
2. WHEN an error occurs in Frontend or Backend, THE System SHALL capture the error with stack trace and context
3. THE System SHALL configure log retention within free-tier limits
4. THE System SHALL capture and log all unhandled promise rejections and exceptions
5. THE System SHALL include request IDs in logs for request tracing

### Requirement 11: Performance Optimization

**User Story:** As a user, I want the application to load quickly on mobile networks, so that I can use it efficiently in low-bandwidth conditions.

#### Acceptance Criteria

1. THE Frontend SHALL achieve a Lighthouse performance score above 80
2. THE System SHALL enable CDN caching for static assets with appropriate cache headers
3. THE System SHALL compress all text-based responses (HTML, CSS, JS, JSON) with gzip or brotli
4. THE System SHALL lazy-load images and non-critical JavaScript
5. THE System SHALL implement service worker caching for offline functionality

### Requirement 12: Security Configuration

**User Story:** As a security-conscious user, I want the application to follow security best practices, so that my data is protected from common vulnerabilities.

#### Acceptance Criteria

1. THE System SHALL configure security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
2. THE System SHALL enable CORS with appropriate origin restrictions
3. THE System SHALL implement rate limiting on API endpoints to prevent abuse
4. THE System SHALL sanitize all user inputs to prevent XSS and SQL injection
5. THE System SHALL configure the Database to use SSL/TLS connections only

### Requirement 13: Rollback Capability

**User Story:** As a developer, I want the ability to rollback to a previous deployment, so that I can quickly recover from problematic releases.

#### Acceptance Criteria

1. THE Hosting_Provider SHALL maintain at least 3 previous deployment versions
2. WHEN a Rollback is initiated, THE System SHALL revert to the previous working deployment within 5 minutes
3. THE System SHALL preserve Database state during Rollback operations
4. THE System SHALL notify developers when a Rollback is performed
5. THE System SHALL document the Rollback procedure in deployment documentation

### Requirement 14: Cost Monitoring

**User Story:** As a project owner, I want to monitor resource usage to ensure we stay within free-tier limits, so that we don't incur unexpected costs.

#### Acceptance Criteria

1. THE System SHALL monitor bandwidth usage for Frontend and Backend
2. THE System SHALL monitor Database storage and connection usage
3. THE System SHALL monitor Cache memory usage
4. WHEN usage approaches 80% of free-tier limits, THE System SHALL alert the administrator
5. THE System SHALL document free-tier limits for all services in deployment documentation

### Requirement 15: Documentation

**User Story:** As a developer, I want comprehensive deployment documentation, so that I can maintain and troubleshoot the production environment.

#### Acceptance Criteria

1. THE System SHALL include a deployment guide with step-by-step instructions
2. THE System SHALL document all Environment_Variables and their purposes
3. THE System SHALL document DNS configuration steps
4. THE System SHALL document the Rollback procedure
5. THE System SHALL document troubleshooting steps for common issues

### Requirement 16: External Service Configuration

**User Story:** As a developer, I want to configure free external services (email SMTP, LibreTranslate, TensorFlow.js) for production, so that features like OTP, translation, and image recognition work correctly without any costs.

#### Acceptance Criteria

1. THE System SHALL configure email SMTP credentials for OTP email delivery (Gmail, SendGrid, or Mailgun free tier)
2. THE System SHALL deploy LibreTranslate service on Render.com free tier for translation
3. THE System SHALL configure TensorFlow.js for client-side or server-side image recognition
4. IF external service credentials are missing, THEN THE System SHALL disable the dependent features gracefully
5. THE System SHALL document which features require which external services

### Requirement 17: Database Seeding

**User Story:** As a system administrator, I want to seed the production Database with initial data, so that the application has necessary reference data on first launch.

#### Acceptance Criteria

1. THE System SHALL provide a database seeding script for initial data
2. WHEN the Database is first deployed, THE System SHALL run the seeding script
3. THE System SHALL seed product categories and common products
4. THE System SHALL NOT overwrite existing data when seeding
5. THE System SHALL log all seeding operations for audit purposes

### Requirement 18: Backup and Recovery

**User Story:** As a system administrator, I want automated Database backups, so that I can recover data in case of failure.

#### Acceptance Criteria

1. THE System SHALL configure automated Database backups if available on the free tier
2. THE System SHALL retain at least 7 days of backup history
3. THE System SHALL document the backup restoration procedure
4. THE System SHALL test backup restoration at least once before production launch
5. IF automated backups are not available, THEN THE System SHALL document manual backup procedures
