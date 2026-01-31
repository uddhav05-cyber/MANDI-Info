# Architecture Overview: Multilingual Mandi

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Users (Vendors & Buyers)                 │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTPS (SSL/TLS)
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
┌───────▼────────┐                    ┌────────▼────────┐
│   Frontend     │                    │   Backend API   │
│   (Vercel)     │◄──────────────────►│  (Render.com)   │
│                │     API Calls      │                 │
│ mandiinfo.in   │                    │ api.mandiinfo.in│
└────────────────┘                    └─────────┬───────┘
                                                │
                        ┌───────────────────────┼───────────────────┐
                        │                       │                   │
                ┌───────▼────────┐    ┌────────▼────────┐  ┌──────▼──────┐
                │   PostgreSQL   │    │     Redis       │  │  External   │
                │   (Neon.tech)  │    │   (Upstash)     │  │  Services   │
                │                │    │                 │  │             │
                │  - Users       │    │  - Sessions     │  │ - Gmail     │
                │  - Products    │    │  - OTP codes    │  │ - Sentry    │
                │  - Vendors     │    │  - Translations │  │ - Libre     │
                │  - Prices      │    │  - Cache        │  │   Translate │
                └────────────────┘    └─────────────────┘  └─────────────┘
```

## Technology Stack

### Frontend (Vercel)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **PWA**: Service Workers with Workbox
- **Offline Storage**: IndexedDB
- **Hosting**: Vercel (Free Tier)
- **CDN**: Vercel Edge Network (Global)

**Free Tier Limits**:
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL/TLS
- Global CDN

### Backend (Render.com)
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT with email OTP
- **Security**: Helmet.js, CORS, Rate Limiting
- **Hosting**: Render.com (Free Tier)

**Free Tier Limits**:
- 750 hours/month
- 512 MB RAM
- 0.1 CPU
- Spins down after 15 minutes of inactivity
- Cold start: ~30 seconds

### Database (Neon.tech)
- **Type**: PostgreSQL 16
- **Features**: 
  - Serverless with auto-scaling
  - Automatic backups (7-day retention)
  - Connection pooling (PgBouncer)
  - SSL/TLS encryption
- **Region**: US East (Ohio)

**Free Tier Limits**:
- 0.5 GB storage
- 100 compute hours/month
- Auto scale-to-zero after 5 minutes
- Up to 10,000 concurrent connections (pooled)

### Cache (Upstash)
- **Type**: Redis 7.x
- **Features**:
  - Serverless Redis
  - TLS encryption
  - REST API support
  - Global replication (paid tier only)
- **Region**: US East

**Free Tier Limits**:
- 10,000 commands/day
- 100 MB storage
- Eviction policy: allkeys-lru

### External Services (All Free)

#### Email OTP (Gmail SMTP)
- **Service**: Gmail SMTP
- **Limit**: 500 emails/day
- **Alternative**: SendGrid (100/day) or Mailgun (5,000/month)

#### Translation (LibreTranslate)
- **Service**: LibreTranslate (open-source)
- **Deployment**: Self-hosted on Render.com or use public instance
- **Languages**: 30+ including Hindi, Bhojpuri, Marwari

#### Image Recognition (TensorFlow.js)
- **Service**: TensorFlow.js with MobileNet
- **Deployment**: Client-side or server-side
- **Models**: Pre-trained models (no API costs)

#### Error Tracking (Sentry)
- **Service**: Sentry.io
- **Limit**: 5,000 errors/month
- **Retention**: 30 days

#### Uptime Monitoring (UptimeRobot)
- **Service**: UptimeRobot
- **Limit**: 50 monitors
- **Check Interval**: 5 minutes

#### Keep Warm (Cron-job.org)
- **Service**: Cron-job.org
- **Purpose**: Ping backend every 14 minutes to prevent cold starts
- **Limit**: Unlimited cron jobs

## Data Flow

### User Registration Flow
```
User → Frontend → Backend API → Database
                      ↓
                  SMTP Server
                      ↓
                  User Email (OTP)
```

### Product Search Flow
```
User → Frontend → Backend API → Database
                      ↓
                  Redis Cache (if cached)
                      ↓
                  Frontend (results)
```

### Translation Flow
```
User → Frontend → Backend API → Redis Cache (check)
                      ↓
                  LibreTranslate (if not cached)
                      ↓
                  Redis Cache (store)
                      ↓
                  Frontend (translated text)
```

### Image Recognition Flow
```
User → Frontend → TensorFlow.js (client-side)
                      ↓
                  Backend API (product matching)
                      ↓
                  Database (product details)
                      ↓
                  Frontend (results)
```

## Security Architecture

### Authentication
- **Method**: Email-based OTP (One-Time Password)
- **Token**: JWT with 7-day expiration
- **Storage**: HTTP-only cookies (recommended) or localStorage

### Data Encryption
- **In Transit**: TLS 1.2+ for all connections
- **At Rest**: Database encryption (Neon.tech default)
- **Passwords**: bcrypt hashing (if used)

### API Security
- **CORS**: Whitelist frontend domain only
- **Rate Limiting**: 100 requests/minute per IP
- **Headers**: Security headers via Helmet.js
- **Input Validation**: Sanitize all user inputs

### Environment Variables
- **Storage**: Hosting provider's secure vault
- **Access**: Never committed to Git
- **Rotation**: Rotate secrets quarterly

## Deployment Architecture

### CI/CD Pipeline
```
Developer → Git Push → GitHub
                         ↓
            ┌────────────┴────────────┐
            │                         │
    ┌───────▼────────┐      ┌────────▼────────┐
    │  Vercel Build  │      │  Render Build   │
    │                │      │                 │
    │  1. npm install│      │  1. npm install │
    │  2. npm build  │      │  2. npm build   │
    │  3. Deploy CDN │      │  3. Run migrate │
    │                │      │  4. npm start   │
    └────────────────┘      └─────────────────┘
            │                         │
            └────────────┬────────────┘
                         │
                    Production
```

### Deployment Environments
- **Production**: mandiinfo.in (main branch)
- **Staging**: Not configured (can use Vercel preview deployments)
- **Development**: localhost

## Monitoring and Observability

### Health Checks
- **Endpoint**: `/api/health`
- **Checks**: Database, Redis, Memory, Uptime
- **Frequency**: Every 5 minutes (UptimeRobot)
- **Alerts**: Email on failure

### Error Tracking
- **Service**: Sentry
- **Capture**: Unhandled errors, API errors, validation errors
- **Context**: User ID, request ID, stack trace
- **Alerts**: Email on new errors

### Logging
- **Backend**: Console logs (Render.com dashboard)
- **Frontend**: Browser console + Sentry
- **Retention**: 7 days (Render.com)

### Metrics
- **Performance**: Lighthouse CI (weekly)
- **Uptime**: UptimeRobot (99.9% target)
- **Errors**: Sentry dashboard
- **Usage**: Service dashboards (Vercel, Render, Neon, Upstash)

## Scaling Considerations

### Current Capacity (Free Tier)
- **Users**: ~1,000 concurrent users
- **Requests**: ~100,000 requests/day
- **Storage**: 0.5 GB database + 100 MB cache
- **Bandwidth**: 100 GB/month (frontend) + 100 GB/month (backend)

### Bottlenecks
1. **Backend RAM**: 512 MB (can handle ~50 concurrent requests)
2. **Database Storage**: 0.5 GB (can store ~10,000 products)
3. **Redis Commands**: 10,000/day (can cache ~1,000 translations/day)
4. **Cold Starts**: 30-second delay after 15 minutes of inactivity

### Scaling Strategy
When free tier limits are reached:

1. **Optimize First**:
   - Implement aggressive caching
   - Optimize database queries
   - Compress images
   - Reduce API payload sizes

2. **Upgrade Services** (if needed):
   - Render.com: $7/month (1 GB RAM, no cold starts)
   - Neon.tech: $19/month (3 GB storage, more compute)
   - Upstash: $10/month (100,000 commands/day)

3. **Alternative Free Options**:
   - Move backend to Railway.app or Fly.io (different free tiers)
   - Use Supabase for database (1 GB free)
   - Use Redis Cloud (30 MB free)

## Disaster Recovery

### Backup Strategy
- **Database**: Automatic backups (7-day retention on Neon.tech)
- **Manual Backups**: Weekly pg_dump exports
- **Code**: Git repository (GitHub)
- **Configuration**: Documented in .env.production.example

### Recovery Procedures
1. **Database Failure**: Restore from Neon.tech backup (< 5 minutes)
2. **Backend Failure**: Redeploy from Render.com (< 5 minutes)
3. **Frontend Failure**: Redeploy from Vercel (< 2 minutes)
4. **Complete Failure**: Redeploy all services (< 30 minutes)

### RTO/RPO
- **Recovery Time Objective (RTO)**: 30 minutes
- **Recovery Point Objective (RPO)**: 24 hours (last backup)

## Cost Management

### Monthly Cost Breakdown
| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| Vercel | 100 GB bandwidth | ~10 GB | $0 |
| Render.com | 750 hours | ~720 hours | $0 |
| Neon.tech | 0.5 GB storage | ~0.2 GB | $0 |
| Upstash | 10,000 commands/day | ~5,000/day | $0 |
| Sentry | 5,000 errors/month | ~1,000/month | $0 |
| Gmail SMTP | 500 emails/day | ~50/day | $0 |
| **Total** | | | **$0** |

### Cost Optimization
- Cache aggressively to reduce database queries
- Compress all responses to reduce bandwidth
- Use CDN caching to reduce backend load
- Implement rate limiting to prevent abuse
- Monitor usage daily to stay within limits

## Performance Targets

### Frontend
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Lighthouse Score**: > 80

### Backend
- **API Response Time**: < 500ms (95th percentile)
- **Health Check**: < 100ms
- **Cold Start**: < 30s

### Database
- **Query Time**: < 100ms (95th percentile)
- **Connection Time**: < 500ms

### Overall
- **Uptime**: 99.5% (excluding cold starts)
- **Error Rate**: < 1%

---

**Last Updated**: January 29, 2026
**Version**: 1.0.0
