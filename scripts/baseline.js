const { execSync } = require('child_process');

try {
  console.log('Baselining database with 20260830182136_init...');
  execSync('npx prisma migrate resolve --applied 20260830182136_init', { stdio: 'inherit' });
} catch (error) {
  console.log('Migration already applied or resolve failed. Continuing...');
}
