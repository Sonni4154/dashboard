import { syncAllQuickBooksData } from './dist/services/syncService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSyncWithLineItems() {
  try {
    console.log('🔄 Testing QuickBooks sync with line items...');
    
    await syncAllQuickBooksData();
    
    console.log('✅ Sync completed successfully with line items!');
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    process.exit(0);
  }
}

testSyncWithLineItems();
