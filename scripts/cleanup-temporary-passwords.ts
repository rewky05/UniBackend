#!/usr/bin/env ts-node

/**
 * Cleanup script for expired temporary passwords
 * 
 * This script removes expired temporary passwords from the database
 * and provides statistics about the cleanup process.
 * 
 * Usage:
 *   npm run cleanup-temp-passwords
 *   or
 *   npx ts-node scripts/cleanup-temporary-passwords.ts
 */

// Load environment variables from .env.local using Node.js built-in
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Simple .env.local loader
function loadEnvFile() {
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile();

import { TemporaryPasswordService } from '../lib/services/temporary-password.service';

async function main() {
  console.log('🧹 Starting temporary password cleanup...');
  console.log('=====================================');
  
  try {
    const tempPasswordService = TemporaryPasswordService.getInstance();
    
    // Get stats before cleanup
    console.log('📊 Getting cleanup statistics...');
    const statsBefore = await tempPasswordService.getCleanupStats();
    console.log('Before cleanup:', statsBefore);
    
    // Perform cleanup
    console.log('🧹 Cleaning up expired temporary passwords...');
    const cleanedCount = await tempPasswordService.cleanupExpiredPasswords();
    
    // Get stats after cleanup
    console.log('📊 Getting cleanup statistics after cleanup...');
    const statsAfter = await tempPasswordService.getCleanupStats();
    console.log('After cleanup:', statsAfter);
    
    console.log('=====================================');
    console.log(`✅ Cleanup completed successfully!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Total temporary passwords: ${statsAfter.total}`);
    console.log(`   - Expired passwords cleaned: ${cleanedCount}`);
    console.log(`   - Sent passwords: ${statsAfter.sent}`);
    console.log(`   - Remaining expired: ${statsAfter.expired}`);
    
    if (cleanedCount > 0) {
      console.log(`🎉 Successfully cleaned up ${cleanedCount} expired temporary passwords`);
    } else {
      console.log(`✨ No expired temporary passwords found to clean up`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
