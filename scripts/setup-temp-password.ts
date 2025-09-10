#!/usr/bin/env ts-node

/**
 * Setup script for temporary password system
 * 
 * This script helps set up the required environment variables
 * and tests the system configuration.
 * 
 * Usage:
 *   npm run setup-temp-password
 *   or
 *   npx ts-node scripts/setup-temp-password.ts
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

function generateEncryptionKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

function updateEnvFile(key: string, value: string): void {
  const envPath = join(process.cwd(), '.env.local');
  let envContent = '';
  
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }
  
  // Check if key already exists
  const keyRegex = new RegExp(`^${key}=.*$`, 'm');
  if (keyRegex.test(envContent)) {
    // Update existing key
    envContent = envContent.replace(keyRegex, `${key}=${value}`);
  } else {
    // Add new key
    envContent += `\n# Temporary Password System\n${key}=${value}\n`;
  }
  
  writeFileSync(envPath, envContent);
  console.log(`✅ Updated ${key} in .env.local`);
}

async function main() {
  console.log('🔧 Setting up Temporary Password System');
  console.log('======================================');
  
  try {
    // Generate encryption key
    console.log('🔑 Generating encryption key...');
    const encryptionKey = generateEncryptionKey();
    console.log(`Generated key: ${encryptionKey}`);
    
    // Update .env.local
    console.log('\n📝 Updating .env.local file...');
    updateEnvFile('TEMP_PASSWORD_ENCRYPTION_KEY', encryptionKey);
    
    // Check for existing email configuration
    console.log('\n📧 Checking email configuration...');
    const envPath = join(process.cwd(), '.env.local');
    const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
    
    const hasResendKey = envContent.includes('RESEND_API_KEY=');
    const hasFromEmail = envContent.includes('RESEND_FROM_EMAIL=');
    const hasAppUrl = envContent.includes('NEXT_PUBLIC_APP_URL=');
    
    console.log(`RESEND_API_KEY: ${hasResendKey ? '✅ Set' : '❌ Missing'}`);
    console.log(`RESEND_FROM_EMAIL: ${hasFromEmail ? '✅ Set' : '❌ Missing'}`);
    console.log(`NEXT_PUBLIC_APP_URL: ${hasAppUrl ? '✅ Set' : '❌ Missing'}`);
    
    if (!hasResendKey) {
      console.log('\n⚠️ Email configuration missing!');
      console.log('Add these to your .env.local file:');
      console.log('RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
      console.log('RESEND_FROM_EMAIL=UniHealth Admin <noreply@yourdomain.com>');
      console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000');
    }
    
    console.log('\n✅ Setup completed!');
    console.log('\n🧪 Next steps:');
    console.log('1. Test the system: npm run test-temp-password');
    console.log('2. If you have email configured, test with: npm run test-temp-password -- --send-email');
    console.log('3. Run cleanup: npm run cleanup-temp-passwords');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
