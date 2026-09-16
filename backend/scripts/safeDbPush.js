import { execSync } from 'child_process';

console.log('🔄 Running database schema push (prisma db push --accept-data-loss)...');

try {
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });
  console.log('✅ Database schema synchronized successfully.');
} catch (error) {
  console.warn('\n⚠️ [POST_BUILD_HOOK] Warning: Could not reach the database server during build.');
  console.warn('⚠️ The schema push was skipped so deployment can complete successfully.');
  console.warn('👉 Note: Check your PostgreSQL add-on status or connection URL in Clever Cloud.\n');
  // Exit with 0 so Clever Cloud's POST_BUILD_HOOK does not abort deployment
  process.exit(0);
}
