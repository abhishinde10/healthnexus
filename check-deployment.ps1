# HealthNexus Deployment Readiness Check
# PowerShell script to verify deployment readiness

param(
    [string]$Environment = "development",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

# Colors for output
$Colors = @{
    Green = "Green"
    Red = "Red"
    Yellow = "Yellow"
    Blue = "Cyan"
}

function Write-Status {
    param($Message, $Color = "Green")
    Write-Host "[INFO] $Message" -ForegroundColor $Colors[$Color]
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

function Write-Header {
    param($Message)
    Write-Host "`n================================" -ForegroundColor $Colors.Blue
    Write-Host $Message -ForegroundColor $Colors.Blue
    Write-Host "================================" -ForegroundColor $Colors.Blue
}

# Check if required files exist
function Test-RequiredFiles {
    Write-Header "Checking Required Files"
    
    $requiredFiles = @(
        "package.json",
        "docker-compose.yml",
        "backend/package.json",
        "backend/Dockerfile",
        "backend/server.js",
        "backend/.env",
        "frontend/package.json",
        "frontend/Dockerfile",
        ".github/workflows/ci-cd.yml",
        "DEPLOYMENT.md"
    )
    
    $missingFiles = @()
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Status "✓ $file" "Green"
        } else {
            Write-Error "✗ $file (missing)"
            $missingFiles += $file
        }
    }
    
    if ($missingFiles.Count -eq 0) {
        Write-Status "All required files are present ✓"
        return $true
    } else {
        Write-Error "Missing $($missingFiles.Count) required files"
        return $false
    }
}

# Check environment configuration
function Test-EnvironmentConfig {
    Write-Header "Checking Environment Configuration"
    
    $envFile = if ($Environment -eq "production") { ".env.production" } else { "backend/.env" }
    
    if (-not (Test-Path $envFile)) {
        Write-Error "Environment file $envFile not found"
        return $false
    }
    
    $envContent = Get-Content $envFile
    $requiredVars = @(
        "PORT",
        "MONGODB_URI",
        "JWT_SECRET",
        "NODE_ENV"
    )
    
    $missingVars = @()
    foreach ($var in $requiredVars) {
        $found = $envContent | Where-Object { $_ -match "^$var\s*=" }
        if ($found) {
            Write-Status "✓ $var is configured" "Green"
        } else {
            Write-Error "✗ $var is missing"
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -eq 0) {
        Write-Status "Environment configuration is complete ✓"
        return $true
    } else {
        Write-Error "Missing $($missingVars.Count) required environment variables"
        return $false
    }
}

# Check Docker setup
function Test-DockerSetup {
    Write-Header "Checking Docker Setup"
    
    try {
        $dockerVersion = docker --version
        Write-Status "✓ Docker: $dockerVersion" "Green"
    } catch {
        Write-Error "✗ Docker is not installed or not accessible"
        return $false
    }
    
    try {
        $composeVersion = docker-compose --version
        Write-Status "✓ Docker Compose: $composeVersion" "Green"
    } catch {
        Write-Error "✗ Docker Compose is not installed or not accessible"
        return $false
    }
    
    # Check if Docker is running
    try {
        docker ps | Out-Null
        Write-Status "✓ Docker daemon is running" "Green"
    } catch {
        Write-Error "✗ Docker daemon is not running"
        return $false
    }
    
    Write-Status "Docker setup is ready ✓"
    return $true
}

# Check dependencies
function Test-Dependencies {
    Write-Header "Checking Dependencies"
    
    # Check backend dependencies
    if (Test-Path "backend/package.json") {
        Push-Location backend
        try {
            if (Test-Path "node_modules") {
                Write-Status "✓ Backend dependencies are installed" "Green"
            } else {
                Write-Warning "Backend node_modules not found. Run 'npm install' in backend/"
            }
        } finally {
            Pop-Location
        }
    }
    
    # Check frontend dependencies
    if (Test-Path "frontend/package.json") {
        Push-Location frontend
        try {
            if (Test-Path "node_modules") {
                Write-Status "✓ Frontend dependencies are installed" "Green"
            } else {
                Write-Warning "Frontend node_modules not found. Run 'npm install' in frontend/"
            }
        } finally {
            Pop-Location
        }
    }
    
    return $true
}

# Check port availability
function Test-PortAvailability {
    Write-Header "Checking Port Availability"
    
    $ports = @(3000, 3001, 27017, 6379, 80, 443)
    $usedPorts = @()
    
    foreach ($port in $ports) {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($connection) {
            Write-Warning "Port $port is in use"
            $usedPorts += $port
        } else {
            Write-Status "✓ Port $port is available" "Green"
        }
    }
    
    if ($usedPorts.Count -eq 0) {
        Write-Status "All required ports are available ✓"
    } else {
        Write-Warning "Some ports are in use. You may need to stop existing services."
    }
    
    return $true
}

# Check security configuration
function Test-SecurityConfig {
    Write-Header "Checking Security Configuration"
    
    $envFile = if ($Environment -eq "production") { ".env.production" } else { "backend/.env" }
    
    if (Test-Path $envFile) {
        $envContent = Get-Content $envFile
        
        # Check JWT secret strength
        $jwtSecret = $envContent | Where-Object { $_ -match "^JWT_SECRET\s*=\s*(.+)$" }
        if ($jwtSecret -and ($jwtSecret -replace "^JWT_SECRET\s*=\s*", "").Length -ge 32) {
            Write-Status "✓ JWT secret is strong enough" "Green"
        } else {
            Write-Error "✗ JWT secret is too weak (should be 32+ characters)"
        }
        
        # Check if production uses secure settings
        if ($Environment -eq "production") {
            $nodeEnv = $envContent | Where-Object { $_ -match "^NODE_ENV\s*=\s*production" }
            if ($nodeEnv) {
                Write-Status "✓ NODE_ENV is set to production" "Green"
            } else {
                Write-Error "✗ NODE_ENV should be set to production"
            }
        }
    }
    
    return $true
}

# Main function
function Start-DeploymentCheck {
    Write-Host "🏥 HealthNexus Deployment Readiness Check" -ForegroundColor $Colors.Blue
    Write-Host "Environment: $Environment" -ForegroundColor $Colors.Blue
    Write-Host "Timestamp: $(Get-Date)" -ForegroundColor $Colors.Blue
    Write-Host ""
    
    $checks = @(
        { Test-RequiredFiles },
        { Test-EnvironmentConfig },
        { Test-DockerSetup },
        { Test-Dependencies },
        { Test-PortAvailability },
        { Test-SecurityConfig }
    )
    
    $passedChecks = 0
    $totalChecks = $checks.Count
    
    foreach ($check in $checks) {
        if (& $check) {
            $passedChecks++
        }
    }
    
    Write-Header "Deployment Readiness Summary"
    
    if ($passedChecks -eq $totalChecks) {
        Write-Status "🎉 All checks passed! Your project is ready for deployment." "Green"
        Write-Status "Next steps:" "Blue"
        Write-Host "  1. Review the DEPLOYMENT.md guide"
        Write-Host "  2. Set up your production environment variables"
        Write-Host "  3. Run deployment: ./deploy.sh $Environment"
    } else {
        Write-Warning "⚠️  $passedChecks/$totalChecks checks passed. Please address the issues above."
        Write-Status "Common fixes:" "Blue"
        Write-Host "  1. Install missing dependencies: npm run setup"
        Write-Host "  2. Configure environment variables in .env files"
        Write-Host "  3. Install Docker and Docker Compose"
        Write-Host "  4. Stop conflicting services on required ports"
    }
    
    Write-Host ""
    Write-Status "For detailed deployment instructions, see DEPLOYMENT.md" "Blue"
    
    return $passedChecks -eq $totalChecks
}

# Run the deployment check
$success = Start-DeploymentCheck

# Exit with appropriate code
if ($success) {
    exit 0
} else {
    exit 1
}