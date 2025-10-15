import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function activateToken() {
  // Activate the newest token
  const result1 = await sql`
    UPDATE quickbooks.tokens 
    SET "isActive" = true 
    WHERE id = '1760192846944'
    RETURNING id, "isActive", "expiresAt";
  `;
  
  // Deactivate the old tokens
  const result2 = await sql`
    UPDATE quickbooks.tokens 
    SET "isActive" = false 
    WHERE id IN ('1760191429639', '1759926944520');
  `;
  
  console.log('✅ Activated new token:', result1);
  console.log('✅ Deactivated old tokens:', result2.length, 'tokens');
}

activateToken();
