# HealthNexus Backend Test Script
Write-Host "🚀 Starting HealthNexus Backend Test Suite..." -ForegroundColor Blue

# Start the backend server in background
Write-Host "⚡ Starting backend server..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru

# Wait a moment for server to initialize
Write-Host "⏱️  Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Run the test suite
Write-Host "🧪 Running test suite..." -ForegroundColor Cyan
try {
    node test-backend.js
} catch {
    Write-Host "❌ Test execution failed: $_" -ForegroundColor Red
} finally {
    # Clean up - stop the server process
    if ($serverProcess -and !$serverProcess.HasExited) {
        Write-Host "🛑 Stopping backend server..." -ForegroundColor Yellow
        Stop-Process -Id $serverProcess.Id -Force
        Write-Host "✅ Server stopped." -ForegroundColor Green
    }
}

Write-Host "📝 Test execution completed." -ForegroundColor Blue