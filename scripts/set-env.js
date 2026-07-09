const fs = require('fs');
const path = require('path');

// Read from process.env (Vercel injected variables)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

// Check if they are missing and fail build with a clear error
if (!supabaseUrl) {
  console.error('Error: Missing SUPABASE_URL');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('Error: Missing SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

// Generate the target environment configuration file
const envConfig = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl.trim()}',
  supabaseKey: '${supabaseKey.trim()}'
};
`;

const targetDir = path.join(__dirname, '../src/environments');

// Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Write environment.production.ts (the fileReplacements target for the production
// build config) AND environment.ts (the file actually imported by the app code).
// environment.ts is gitignored and not committed, so on a clean checkout (CI/Vercel)
// it doesn't exist until this script creates it — without it, Angular's
// `fileReplacements` has nothing to replace and the build fails with
// "Could not resolve '../../../environments/environment'".
['environment.production.ts', 'environment.ts'].forEach(fileName => {
  const targetPath = path.join(targetDir, fileName);
  fs.writeFileSync(targetPath, envConfig, { encoding: 'utf8' });
  console.log(`[set-env.js] Successfully generated ${fileName} at ${targetPath}`);
});
