/**
 * Test script to verify Vercel serverless functions are working properly
 */

import { exec } from 'child_process';
import { createServer, request } from 'http';

// Test URLs for our serverless functions
const testUrls = [
  { name: 'Transcript API', url: '/api/transcript', method: 'POST', data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
  { name: 'Video API', url: '/api/video', method: 'POST', data: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } },
  { name: 'Playlist API', url: '/api/playlist', method: 'POST', data: { url: 'https://www.youtube.com/playlist?list=PLLAZ4kZ9dFpOnyRlyS-liKL5ReHDcj4G3' } }
];

console.log('🧪 Testing Vercel Serverless Functions...\n');

// Function to make a request to the local dev server
function testLocalEndpoint(testCase) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing ${testCase.name}...`);
    
    const postData = JSON.stringify(testCase.data);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: testCase.url,
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          console.log(`✅ ${testCase.name} Response Status: ${res.statusCode}`);
          if (res.statusCode === 200) {
            console.log(`📋 ${testCase.name} Response Preview:`, data.substring(0, 200) + (data.length > 200 ? '...' : ''));
          } else {
            console.log(`❌ ${testCase.name} Error Response:`, data);
          }
          resolve({ success: res.statusCode === 200, statusCode: res.statusCode });
        } catch (error) {
          console.log(`❌ ${testCase.name} Error parsing response:`, error.message);
          resolve({ success: false, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`❌ ${testCase.name} Request Error:`, error.message);
      resolve({ success: false, error: error.message });
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
 });
}

// Run tests
async function runTests() {
  console.log('Starting tests against local development server (make sure it\'s running with `npm run dev`)...\n');
  
  for (const testCase of testUrls) {
    await testLocalEndpoint(testCase);
    console.log('---');
  }
  
  console.log('\n✅ Testing completed. Check the results above to verify all serverless functions are working.');
  console.log('\n💡 Remember: In production, these functions will run on Vercel without needing a separate backend server.');
}

// Check if the dev server is running first
function checkDevServer() {
  return new Promise((resolve) => {
    const req = request({
      hostname: 'localhost',
      port: 3000,
      path: '/',
      method: 'GET'
    }, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.end();
  });
}

// Main execution
async function main() {
  console.log('🚀 StudySync AI - Serverless Functions Verification');
  console.log('================================================\n');
  
  const isServerRunning = await checkDevServer();
  
  if (!isServerRunning) {
    console.log('⚠️  Warning: Local development server does not appear to be running!');
    console.log('💡 Please start the development server with: npm run dev');
    console.log('🔧 Then run this test again: node test-serverless-functions.js\n');
    process.exit(1);
  } else {
    console.log('✅ Local development server is running on http://localhost:3000\n');
    await runTests();
  }
}

main().catch(console.error);