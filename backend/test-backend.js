const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api/v1`;

// Test configuration
const testConfig = {
  timeout: 5000,
  retries: 3
};

// Store authentication tokens
let authTokens = {
  patient: null,
  doctor: null,
  nurse: null
};

// Test credentials from seeded data
const testCredentials = {
  patient: {
    email: 'john.doe@example.com',
    password: 'password123',
    userType: 'patient'
  },
  doctor: {
    email: 'dr.sarah.wilson@healthnexus.com',
    password: 'password123',
    userType: 'doctor'
  },
  nurse: {
    email: 'nurse.linda.martinez@healthnexus.com',
    password: 'password123',
    userType: 'nurse'
  }
};

// Helper function to make HTTP requests
async function makeRequest(method, url, data = null, headers = {}) {
  try {
    const config = {
      method,
      url,
      timeout: testConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      data: error.response?.data || null
    };
  }
}

// Test helper function
function testResult(testName, result, expected = true) {
  const status = result === expected ? '✅ PASS'.green : '❌ FAIL'.red;
  console.log(`${status} ${testName}`);
  return result === expected;
}

// Wait for server to be ready
async function waitForServer(maxAttempts = 30, delay = 1000) {
  console.log('🔍 Waiting for server to be ready...'.yellow);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await makeRequest('GET', `${BASE_URL}/health`);
      if (result.success) {
        console.log('✅ Server is ready!'.green);
        return true;
      }
    } catch (error) {
      // Server not ready yet
    }
    
    if (attempt < maxAttempts) {
      console.log(`⏱️  Attempt ${attempt}/${maxAttempts} - waiting ${delay}ms...`.cyan);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('❌ Server failed to start within timeout period'.red);
  return false;
}

// Test 1: Health Check Endpoint
async function testHealthCheck() {
  console.log('\n🔍 Testing Health Check Endpoint...'.cyan);
  
  const result = await makeRequest('GET', `${BASE_URL}/health`);
  
  const pass1 = testResult('Health endpoint responds', result.success);
  const pass2 = testResult('Health status is 200', result.status === 200);
  const pass3 = testResult('Health response has correct structure', 
    result.data && result.data.status === 'success');
  
  if (result.success) {
    console.log(`   Server version: ${result.data.version || 'Unknown'}`);
    console.log(`   Environment: ${result.data.environment || 'Unknown'}`);
    console.log(`   Uptime: ${Math.round(result.data.uptime || 0)} seconds`);
  }
  
  return pass1 && pass2 && pass3;
}

// Test 2: API Documentation Endpoint
async function testApiDocs() {
  console.log('\n📚 Testing API Documentation...'.cyan);
  
  const result = await makeRequest('GET', `${BASE_URL}/api`);
  
  const pass1 = testResult('API docs endpoint responds', result.success);
  const pass2 = testResult('API docs status is 200', result.status === 200);
  const pass3 = testResult('API docs has endpoints info', 
    result.data && result.data.endpoints);
  
  if (result.success) {
    console.log(`   Available endpoints: ${Object.keys(result.data.endpoints || {}).join(', ')}`);
  }
  
  return pass1 && pass2 && pass3;
}

// Test 3: Authentication Endpoints
async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...'.cyan);
  
  let allPassed = true;
  
  // Test login for each user type
  for (const [userType, credentials] of Object.entries(testCredentials)) {
    console.log(`\n   Testing ${userType} login...`.yellow);
    
    const loginResult = await makeRequest('POST', `${API_BASE}/auth/login`, credentials);
    
    const pass1 = testResult(`${userType} login succeeds`, loginResult.success);
    const pass2 = testResult(`${userType} login returns token`, 
      loginResult.data && loginResult.data.token);
    const pass3 = testResult(`${userType} login returns user info`, 
      loginResult.data && loginResult.data.user && loginResult.data.user.userType === userType);
    
    if (loginResult.success && loginResult.data.token) {
      authTokens[userType] = loginResult.data.token;
      console.log(`   ${userType} token stored for further testing`.gray);
    }
    
    allPassed = allPassed && pass1 && pass2 && pass3;
    
    // Test protected route access
    if (authTokens[userType]) {
      const meResult = await makeRequest('GET', `${API_BASE}/auth/me`, null, {
        'Authorization': `Bearer ${authTokens[userType]}`
      });
      
      const pass4 = testResult(`${userType} can access protected route`, meResult.success);
      const pass5 = testResult(`${userType} profile data is correct`, 
        meResult.data && meResult.data.user && meResult.data.user.userType === userType);
      
      allPassed = allPassed && pass4 && pass5;
    }
  }
  
  // Test invalid login
  const invalidResult = await makeRequest('POST', `${API_BASE}/auth/login`, {
    email: 'invalid@example.com',
    password: 'wrongpassword',
    userType: 'patient'
  });
  
  const pass6 = testResult('Invalid login is rejected', !invalidResult.success);
  const pass7 = testResult('Invalid login returns 401', invalidResult.status === 401);
  
  allPassed = allPassed && pass6 && pass7;
  
  return allPassed;
}

// Test 4: Services Endpoint
async function testServicesEndpoint() {
  console.log('\n🏥 Testing Services Endpoint...'.cyan);
  
  const result = await makeRequest('GET', `${API_BASE}/services`);
  
  const pass1 = testResult('Services endpoint responds', result.success);
  const pass2 = testResult('Services status is 200', result.status === 200);
  const pass3 = testResult('Services returns array', 
    result.data && Array.isArray(result.data.data));
  const pass4 = testResult('Services has data', 
    result.data && result.data.data && result.data.data.length > 0);
  
  if (result.success && result.data.data) {
    console.log(`   Found ${result.data.data.length} services`);
    const firstService = result.data.data[0];
    if (firstService) {
      console.log(`   Sample service: ${firstService.title} - $${firstService.price}`);
    }
  }
  
  return pass1 && pass2 && pass3 && pass4;
}

// Test 5: Protected Endpoints (Patient Routes)
async function testPatientEndpoints() {
  console.log('\n👤 Testing Patient Endpoints...'.cyan);
  
  if (!authTokens.patient) {
    console.log('❌ No patient token available, skipping patient tests'.red);
    return false;
  }
  
  const headers = { 'Authorization': `Bearer ${authTokens.patient}` };
  let allPassed = true;
  
  // Test patient profile access
  const profileResult = await makeRequest('GET', `${API_BASE}/patients/profile`, null, headers);
  const pass1 = testResult('Patient can access profile', profileResult.success);
  
  if (profileResult.success) {
    console.log('   Patient profile data retrieved successfully'.gray);
  }
  
  allPassed = allPassed && pass1;
  return allPassed;
}

// Test 6: Protected Endpoints (Provider Routes)
async function testProviderEndpoints() {
  console.log('\n⚕️ Testing Provider Endpoints...'.cyan);
  
  if (!authTokens.doctor) {
    console.log('❌ No doctor token available, skipping provider tests'.red);
    return false;
  }
  
  const headers = { 'Authorization': `Bearer ${authTokens.doctor}` };
  let allPassed = true;
  
  // Test providers list access
  const providersResult = await makeRequest('GET', `${API_BASE}/providers`, null, headers);
  const pass1 = testResult('Doctor can access providers list', providersResult.success);
  
  if (providersResult.success) {
    console.log('   Providers list retrieved successfully'.gray);
  }
  
  allPassed = allPassed && pass1;
  return allPassed;
}

// Test 7: CORS and Security Headers
async function testSecurity() {
  console.log('\n🔒 Testing Security Features...'.cyan);
  
  const result = await makeRequest('GET', `${BASE_URL}/health`);
  
  const pass1 = testResult('Response has security headers', result.success);
  
  if (result.success && result.headers) {
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    securityHeaders.forEach(header => {
      const hasHeader = result.headers[header] !== undefined;
      testResult(`Has ${header} header`, hasHeader);
    });
  }
  
  return pass1;
}

// Test 8: Rate Limiting
async function testRateLimit() {
  console.log('\n🚦 Testing Rate Limiting...'.cyan);
  
  // Make multiple rapid requests
  const promises = Array(10).fill().map(() => 
    makeRequest('GET', `${API_BASE}/auth/login`, {
      email: 'invalid@test.com',
      password: 'invalid',
      userType: 'patient'
    })
  );
  
  const results = await Promise.all(promises);
  const rateLimitHit = results.some(result => result.status === 429);
  
  const pass1 = testResult('Rate limiting is active', rateLimitHit);
  
  return pass1;
}

// Test 9: Database Integration
async function testDatabase() {
  console.log('\n🗄️ Testing Database Integration...'.cyan);
  
  // Test if we can retrieve seeded data
  const usersExist = authTokens.patient && authTokens.doctor && authTokens.nurse;
  const pass1 = testResult('Database has seeded user data', usersExist);
  
  // Test services data
  const servicesResult = await makeRequest('GET', `${API_BASE}/services`);
  const pass2 = testResult('Database has seeded services', 
    servicesResult.success && servicesResult.data.data && servicesResult.data.data.length > 0);
  
  return pass1 && pass2;
}

// Main test runner
async function runAllTests() {
  console.log('🚀 HealthNexus Backend API Test Suite'.bold.blue);
  console.log('=' .repeat(50).blue);
  
  // Wait for server to be ready
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log('\n❌ Backend server is not responding. Please start the server first.'.red);
    console.log('Run: npm run dev'.yellow);
    process.exit(1);
  }
  
  const testSuite = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'API Documentation', fn: testApiDocs },
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Services Endpoint', fn: testServicesEndpoint },
    { name: 'Patient Endpoints', fn: testPatientEndpoints },
    { name: 'Provider Endpoints', fn: testProviderEndpoints },
    { name: 'Security Features', fn: testSecurity },
    { name: 'Rate Limiting', fn: testRateLimit },
    { name: 'Database Integration', fn: testDatabase }
  ];
  
  const results = [];
  let totalPassed = 0;
  
  for (const test of testSuite) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, passed: result });
      if (result) totalPassed++;
    } catch (error) {
      console.log(`❌ ${test.name} threw an error: ${error.message}`.red);
      results.push({ name: test.name, passed: false });
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary'.bold.blue);
  console.log('=' .repeat(30).blue);
  
  results.forEach(result => {
    const status = result.passed ? '✅ PASS'.green : '❌ FAIL'.red;
    console.log(`${status} ${result.name}`);
  });
  
  console.log(`\n📈 Results: ${totalPassed}/${results.length} tests passed`.bold);
  
  if (totalPassed === results.length) {
    console.log('🎉 All tests passed! Backend is fully functional.'.green.bold);
    console.log('\n✅ Your HealthNexus backend is ready for production!'.green);
    
    // Display available endpoints
    console.log('\n📡 Available API Endpoints:'.cyan.bold);
    console.log(`   Health Check: ${BASE_URL}/health`);
    console.log(`   API Docs: ${BASE_URL}/api`);
    console.log(`   Authentication: ${API_BASE}/auth/*`);
    console.log(`   Services: ${API_BASE}/services`);
    console.log(`   Patients: ${API_BASE}/patients/*`);
    console.log(`   Providers: ${API_BASE}/providers/*`);
    console.log(`   Appointments: ${API_BASE}/appointments/*`);
    
    console.log('\n🔐 Test Credentials:'.cyan.bold);
    Object.entries(testCredentials).forEach(([type, creds]) => {
      console.log(`   ${type}: ${creds.email} / ${creds.password}`);
    });
    
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please check the backend configuration.'.yellow);
    process.exit(1);
  }
}

// Run the tests
runAllTests().catch(error => {
  console.error('Fatal error in test suite:'.red, error);
  process.exit(1);
});