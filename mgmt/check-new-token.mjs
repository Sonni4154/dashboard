import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkNewToken() {
  const tokens = await sql`
    SELECT id, "realmId", "isActive", "expiresAt", "lastUpdated"
    FROM quickbooks.tokens 
    WHERE "realmId" = '9130354674010826'
    ORDER BY "lastUpdated" DESC 
    LIMIT 3;
  `;
  
  console.log('=== Recent Tokens ===');
  tokens.forEach((token, i) => {
    console.log(`Token ${i+1}: ID=${token.id}, Active=${token.isActive}, Expires=${token.expiresAt}, Updated=${token.lastUpdated}`);
  });
}

checkNewToken();
