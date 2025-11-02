# HealthNexus Deployment Guide

This guide covers deploying the HealthNexus application in production environments.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- MongoDB 6.0+
- Redis 7.0+ (optional but recommended)
- Nginx (for reverse proxy)

### Environment Setup

1. **Copy environment files:**
```bash
cp .env.production .env
cp backend/.env.example backend/.env
```

2. **Configure environment variables:**
Edit `.env` and `backend/.env` with your production values:
- Database URLs
- JWT secrets
- Email configuration
- SSL certificates
- External service credentials

## 🐳 Docker Deployment (Recommended)

### Development Environment

```bash
# Install dependencies
npm run setup

# Start development servers
docker-compose up -d
```

### Production Environment

```bash
# Build and start production containers
docker-compose --profile production up -d

# Or use the production override
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🏗️ Manual Deployment

### Backend Setup

```bash
cd backend

# Install dependencies
npm ci --only=production

# Run database setup
npm run setup:db

# Start the server
npm run prod
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm ci --only=production

# Build for production
npm run build

# Serve with a web server (nginx/apache)
```

## 🔧 Configuration

### Environment Variables

#### Required Variables
```bash
# Database
MONGODB_URI=mongodb://username:password@host:port/database
REDIS_URL=redis://host:port

# Security
JWT_SECRET=your-super-secure-jwt-secret-32-chars-min
JWT_REFRESH_SECRET=your-super-secure-refresh-secret

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
```

#### Optional Variables
```bash
# Performance
CLUSTER_MODE=true
MAX_WORKERS=0

# Monitoring
ENABLE_MONITORING=true
LOG_LEVEL=info

# Features
ENABLE_REAL_TIME_CHAT=true
ENABLE_VIDEO_CALLS=true
ENABLE_AI_TRIAGE=true
```

### SSL/TLS Configuration

For HTTPS in production:

1. **Obtain SSL certificates** (Let's Encrypt recommended)
2. **Configure Nginx** with SSL
3. **Update environment variables:**
```bash
SSL_KEY_PATH=/path/to/private.key
SSL_CERT_PATH=/path/to/certificate.crt
FRONTEND_URL=https://your-domain.com
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- **Basic Health:** `GET /health`
- **Detailed Health:** `GET /api/v1/health/detailed`
- **Metrics:** `GET /api/v1/health/metrics`
- **Database Status:** `GET /api/v1/health/database`
- **Cache Status:** `GET /api/v1/health/cache`

### Monitoring Setup

The application includes built-in monitoring with:
- Request/response metrics
- Error tracking
- Performance monitoring
- Database health checks
- Cache statistics

### Log Management

Logs are stored in:
- `./logs/app.log` - Application logs
- `./logs/error.log` - Error logs
- `./logs/exceptions.log` - Uncaught exceptions

## 🔒 Security Checklist

### Pre-deployment Security

- [ ] Strong JWT secrets (32+ characters)
- [ ] Database authentication enabled
- [ ] HTTPS/SSL configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] File upload limits set
- [ ] Input validation enabled

### Production Security

- [ ] Firewall configured
- [ ] Database access restricted
- [ ] Regular security updates
- [ ] Log monitoring setup
- [ ] Backup strategy implemented
- [ ] Incident response plan ready

## 🔄 CI/CD Pipeline

### GitHub Actions

The project includes a CI/CD pipeline (`.github/workflows/ci-cd.yml`) that:

1. **Tests:** Runs unit and integration tests
2. **Security:** Performs security scans
3. **Build:** Creates Docker images
4. **Deploy:** Deploys to staging/production
5. **Monitor:** Checks deployment health

### Pipeline Configuration

Update the following secrets in GitHub:
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `MONGODB_URI`
- `JWT_SECRET`
- `PRODUCTION_HOST`
- `SLACK_WEBHOOK_URL`

## 📦 Database Management

### Initial Setup

```bash
# Run database initialization
npm run setup:db

# Seed with sample data
npm run seed:db
```

### Backup & Restore

```bash
# Create backup
npm run backup:db

# Automated backups (cron job)
0 2 * * * /path/to/healthnexus/backend && npm run backup:db
```

### Database Optimization

The application automatically creates optimal indexes on startup. For manual optimization:

```bash
# Optimize database
curl -X POST http://localhost:3001/api/v1/health/database/optimize

# Clean old data
curl -X POST http://localhost:3001/api/v1/health/database/cleanup
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check MongoDB status
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check connection string
echo $MONGODB_URI
```

#### Performance Issues
```bash
# Check application metrics
curl http://localhost:3001/api/v1/health/metrics

# Check cache status
curl http://localhost:3001/api/v1/health/cache
```

#### Memory Issues
```bash
# Check memory usage
curl http://localhost:3001/api/v1/health/detailed

# Restart services
docker-compose restart backend
```

### Log Analysis

```bash
# View application logs
docker-compose logs -f backend

# View nginx logs
docker-compose logs -f nginx

# Search for errors
grep "ERROR" logs/app.log | tail -50
```

## 📈 Performance Optimization

### Database Optimization

- Indexes created automatically
- Connection pooling configured
- Query optimization enabled

### Caching Strategy

- Redis for session storage
- API response caching
- Static file caching

### Frontend Optimization

- Code splitting enabled
- Asset compression
- CDN integration ready

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build --no-cache

# Update database schema
npm run setup:db

# Restart services
docker-compose up -d
```

### Security Updates

```bash
# Update dependencies
npm audit fix

# Rebuild with latest base images
docker-compose build --pull

# Check for security vulnerabilities
npm audit
```

## 📞 Support

### Health Check URLs

- **Application Health:** `http://your-domain.com/health`
- **API Status:** `http://your-domain.com/api`
- **Monitoring Dashboard:** `http://your-domain.com/api/v1/health/detailed`

### Emergency Contacts

- **System Administrator:** admin@healthnexus.com
- **Development Team:** dev@healthnexus.com
- **Security Issues:** security@healthnexus.com

### Documentation

- **API Documentation:** `/api`
- **System Metrics:** `/api/v1/health/metrics`
- **Database Status:** `/api/v1/health/database`

---

## 🎯 Production Checklist

Before going live:

### Infrastructure
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Database secured
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Load balancing configured (if needed)

### Application
- [ ] Environment variables set
- [ ] Health checks passing
- [ ] Performance tested
- [ ] Security tested
- [ ] Error handling tested
- [ ] Log management working

### Team Readiness
- [ ] Team trained on deployment
- [ ] Documentation updated
- [ ] Incident response plan ready
- [ ] Support contacts configured

---

**🏥 HealthNexus Production Deployment Complete! 🎉**

Your healthcare platform is now ready to serve patients, doctors, and healthcare providers with enterprise-grade reliability and security.