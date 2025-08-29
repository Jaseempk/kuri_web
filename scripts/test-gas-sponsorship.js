#!/usr/bin/env node

/**
 * Gas Sponsorship Setup Validation Script
 * 
 * This script validates that all required environment variables
 * are set up correctly for gas sponsorship testing.
 */

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const ENV_FILE = '.env.local';
const REQUIRED_VARS = [
  'VITE_ALCHEMY_API_KEY',
  'VITE_ALCHEMY_GAS_POLICY_ID',
  'VITE_PARA_API_KEY'
];

async function validateEnvironmentSetup() {
  console.log('🔍 Validating Gas Sponsorship Setup...\n');
  
  // Check if .env.local exists
  if (!existsSync(ENV_FILE)) {
    console.error(`❌ ${ENV_FILE} file not found`);
    console.log(`💡 Copy .env.example to ${ENV_FILE} and fill in your values\n`);
    process.exit(1);
  }
  
  console.log(`✅ ${ENV_FILE} file exists`);
  
  try {
    // Read and parse .env.local
    const envContent = await readFile(ENV_FILE, 'utf-8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    // Check required variables
    const missing = [];
    const hasPlaceholder = [];
    
    REQUIRED_VARS.forEach(varName => {
      if (!envVars[varName]) {
        missing.push(varName);
      } else if (envVars[varName].includes('your_') || envVars[varName].includes('_here')) {
        hasPlaceholder.push(varName);
      }
    });
    
    if (missing.length > 0) {
      console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    } else {
      console.log('✅ All required environment variables are present');
    }
    
    if (hasPlaceholder.length > 0) {
      console.warn(`⚠️  Variables with placeholder values: ${hasPlaceholder.join(', ')}`);
      console.log('💡 Replace placeholder values with your actual keys\n');
    } else {
      console.log('✅ All environment variables have values\n');
    }
    
    // Additional setup instructions
    console.log('📋 Setup Checklist:');
    console.log('  1. ✅ Environment file exists');
    console.log(`  2. ${missing.length === 0 ? '✅' : '❌'} Required variables defined`);
    console.log(`  3. ${hasPlaceholder.length === 0 ? '✅' : '⚠️ '} Variables have real values (not placeholders)`);
    console.log('  4. 📋 Create Alchemy Gas Manager Policy (manual step)');
    console.log('  5. 📋 Test gas sponsorship in browser\n');
    
    if (missing.length === 0 && hasPlaceholder.length === 0) {
      console.log('🎉 Environment setup looks good! Ready to test gas sponsorship.');
      console.log('\n🚀 Next steps:');
      console.log('  1. Run: npm run dev');
      console.log('  2. Navigate to any market');
      console.log('  3. Click "Join Circle"');
      console.log('  4. Check browser console for sponsorship logs');
    } else {
      console.log('🔧 Please complete the setup steps above before testing.');
    }
    
  } catch (error) {
    console.error(`❌ Error reading ${ENV_FILE}:`, error.message);
    process.exit(1);
  }
}

// Run validation
validateEnvironmentSetup().catch(console.error);