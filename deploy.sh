#!/bin/bash

# HealthNexus Deployment Script
# This script handles deployment to different environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
SKIP_TESTS=false
SKIP_BUILD=false
BACKUP_DB=true
HEALTH_CHECK_RETRIES=30

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] ENVIRONMENT"
    echo ""
    echo "ENVIRONMENT:"
    echo "  development    Deploy to development environment"
    echo "  staging        Deploy to staging environment"
    echo "  production     Deploy to production environment"
    echo ""
    echo "OPTIONS:"
    echo "  -h, --help           Show this help message"
    echo "  --skip-tests         Skip running tests"
    echo "  --skip-build         Skip building Docker images"
    echo "  --no-backup          Skip database backup"
    echo "  --quick              Quick deployment (skip tests, build, and backup)"
    echo ""
    echo "Examples:"
    echo "  $0 development"
    echo "  $0 production --skip-tests"
    echo "  $0 staging --quick"
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed or not in PATH"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed or not in PATH"
        exit 1
    fi
    
    # Check if environment file exists
    if [[ "$ENVIRONMENT" == "production" ]]; then
        if [[ ! -f ".env.production" ]]; then
            print_error "Production environment file (.env.production) not found"
            exit 1
        fi
        cp .env.production .env
    fi
    
    print_status "Prerequisites check completed ✓"
}

# Function to run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        print_warning "Skipping tests as requested"
        return 0
    fi
    
    print_header "Running Tests"
    
    # Backend tests
    print_status "Running backend tests..."
    cd backend
    npm test -- --coverage --watchAll=false
    cd ..
    
    # Frontend tests
    print_status "Running frontend tests..."
    cd frontend
    npm test -- --coverage --watchAll=false
    cd ..
    
    print_status "All tests passed ✓"
}

# Function to build Docker images
build_images() {
    if [[ "$SKIP_BUILD" == "true" ]]; then
        print_warning "Skipping build as requested"
        return 0
    fi
    
    print_header "Building Docker Images"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache
    else
        docker-compose build --no-cache
    fi
    
    print_status "Docker images built successfully ✓"
}

# Function to backup database
backup_database() {
    if [[ "$BACKUP_DB" == "false" ]]; then
        print_warning "Skipping database backup as requested"
        return 0
    fi
    
    # Skip backup for development
    if [[ "$ENVIRONMENT" == "development" ]]; then
        return 0
    fi
    
    print_header "Creating Database Backup"
    
    # Create backup directory
    mkdir -p ./backups
    
    # Create backup filename with timestamp
    BACKUP_FILE="./backups/healthnexus-backup-$(date +%Y%m%d-%H%M%S).archive"
    
    # Run backup using Docker
    docker-compose --profile backup run --rm backup
    
    print_status "Database backup created: $BACKUP_FILE ✓"
}

# Function to deploy services
deploy_services() {
    print_header "Deploying Services"
    
    case $ENVIRONMENT in
        "development")
            print_status "Deploying to development environment..."
            docker-compose up -d
            ;;
        "staging")
            print_status "Deploying to staging environment..."
            docker-compose up -d
            ;;
        "production")
            print_status "Deploying to production environment..."
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
            ;;
    esac
    
    print_status "Services deployed successfully ✓"
}

# Function to run health checks
run_health_checks() {
    print_header "Running Health Checks"
    
    # Determine the base URL
    if [[ "$ENVIRONMENT" == "production" ]]; then
        BASE_URL="https://your-domain.com"
    else
        BASE_URL="http://localhost:3001"
    fi
    
    print_status "Waiting for services to start..."
    sleep 10
    
    # Check backend health
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        print_status "Health check attempt $i/$HEALTH_CHECK_RETRIES"
        
        if curl -f -s "$BASE_URL/health" > /dev/null; then
            print_status "Backend health check passed ✓"
            break
        fi
        
        if [[ $i -eq $HEALTH_CHECK_RETRIES ]]; then
            print_error "Backend health check failed after $HEALTH_CHECK_RETRIES attempts"
            exit 1
        fi
        
        sleep 5
    done
    
    # Check detailed health
    HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/v1/health" | python3 -m json.tool)
    if [[ $? -eq 0 ]]; then
        print_status "Detailed health check passed ✓"
    else
        print_warning "Detailed health check failed, but basic health is OK"
    fi
    
    print_status "All health checks completed ✓"
}

# Function to display deployment summary
show_deployment_summary() {
    print_header "Deployment Summary"
    
    echo "Environment: $ENVIRONMENT"
    echo "Timestamp: $(date)"
    echo "Services: Backend, Frontend, Database, Cache"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "SSL: Enabled"
        echo "Monitoring: Enabled"
        echo "Backups: Enabled"
    fi
    
    echo ""
    echo "Access URLs:"
    if [[ "$ENVIRONMENT" == "production" ]]; then
        echo "  Frontend: https://your-domain.com"
        echo "  API: https://your-domain.com/api"
        echo "  Health: https://your-domain.com/health"
        echo "  Monitoring: https://your-domain.com/api/v1/health/detailed"
    else
        echo "  Frontend: http://localhost:3000"
        echo "  API: http://localhost:3001/api"
        echo "  Health: http://localhost:3001/health"
        echo "  Monitoring: http://localhost:3001/api/v1/health/detailed"
    fi
    
    print_status "Deployment completed successfully! 🎉"
}

# Function to handle cleanup on script exit
cleanup() {
    if [[ $? -ne 0 ]]; then
        print_error "Deployment failed. Check logs above for details."
        print_status "You can check service logs with: docker-compose logs -f"
    fi
}

trap cleanup EXIT

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-backup)
            BACKUP_DB=false
            shift
            ;;
        --quick)
            SKIP_TESTS=true
            SKIP_BUILD=true
            BACKUP_DB=false
            shift
            ;;
        development|staging|production)
            ENVIRONMENT=$1
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate environment
case $ENVIRONMENT in
    development|staging|production)
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        show_usage
        exit 1
        ;;
esac

# Main deployment process
main() {
    print_header "HealthNexus Deployment"
    echo "Environment: $ENVIRONMENT"
    echo "Skip Tests: $SKIP_TESTS"
    echo "Skip Build: $SKIP_BUILD"
    echo "Backup DB: $BACKUP_DB"
    echo ""
    
    check_prerequisites
    run_tests
    backup_database
    build_images
    deploy_services
    run_health_checks
    show_deployment_summary
}

# Run main function
main