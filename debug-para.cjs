// Debug script to check Para SDK exports
const path = require('path');
const fs = require('fs');

// Check if the Para SDK is properly installed
const paraSdkPath = path.join(__dirname, 'node_modules', '@getpara', 'react-sdk');

if (fs.existsSync(paraSdkPath)) {
  console.log('✅ Para SDK directory exists');
  
  // Check package.json
  const packageJsonPath = path.join(paraSdkPath, 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('📦 Para SDK version:', packageJson.version);
    console.log('📂 Main entry:', packageJson.main);
    console.log('📂 Module entry:', packageJson.module);
    console.log('📂 Types entry:', packageJson.types);
  }
  
  // Check what files exist
  const files = fs.readdirSync(paraSdkPath);
  console.log('📁 Para SDK files:', files);
  
} else {
  console.log('❌ Para SDK directory not found');
}