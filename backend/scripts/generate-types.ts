import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../../.env') });

async function generateTypes() {
  console.log('🔧 Generating TypeScript types from Supabase schema...\n');

  // Verify SUPABASE_URL is set
  if (!process.env.SUPABASE_URL) {
    console.error('❌ SUPABASE_URL environment variable is required');
    process.exit(1);
  }

  try {
    // Extract project ID from Supabase URL
    const projectId = process.env.SUPABASE_URL.split('//')[1].split('.')[0];
    console.log(`📋 Project ID: ${projectId}`);

    // Generate types using Supabase CLI
    const command = `supabase gen types typescript --project-id ${projectId} > src/db/database.types.ts`;
    
    console.log('⚡ Running command:', command);
    execSync(command, { stdio: 'inherit' });
    
    console.log('\n🎉 TypeScript types generated successfully!');
    console.log('✅ Types saved to: src/db/database.types.ts');
    console.log('✅ You can now use these types in your Drizzle schema');
    
    console.log('\n📋 Next steps:');
    console.log('1. Update your Drizzle schema to use generated types');
    console.log('2. Import Database type in your database connection');
    console.log('3. Use type-safe queries with full autocompletion');
    
  } catch (error) {
    console.error('❌ Failed to generate types:', error);
    console.log('\n💡 Make sure you have:');
    console.log('1. Supabase CLI installed: npm install -g supabase');
    console.log('2. Authenticated with Supabase: supabase login');
    console.log('3. Correct SUPABASE_URL in your .env file');
    process.exit(1);
  }
}

generateTypes();
