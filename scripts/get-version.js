const fs = require('fs');
const { execSync } = require('child_process');
const dotenv = require('dotenv'); // You might need to install this: npm install dotenv

// Get git info
const getGitInfo = () => {
  try {
    const gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim();
    const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    return { gitCommitHash, gitBranch };
  } catch (error) {
    console.error('Failed to get git info:', error);
    return { gitCommitHash: 'unknown', gitBranch: 'unknown' };
  }
};

// Get package version
const getPackageVersion = () => {
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    return packageJson.version || 'unknown';
  } catch (error) {
    console.error('Failed to get package version:', error);
    return 'unknown';
  }
};

// Create version info and update .env file
const createVersionInfo = () => {
  const { gitCommitHash, gitBranch } = getGitInfo();
  const packageVersion = getPackageVersion();
  const timestamp = new Date().toISOString();

  // Create version info JSON
  const versionInfo = {
    version: packageVersion,
    gitCommitHash,
    gitBranch,
    buildTime: timestamp
  };

  // Write to config file
  fs.writeFileSync('./src/config/version.json', JSON.stringify(versionInfo, null, 2));
  
  // Update environment variables in .env file
  let envContent = '';
  try {
    envContent = fs.readFileSync('./.env', 'utf8');
  } catch (err) {
    console.log('No .env file found, creating a new one');
  }

  // Parse existing .env file
  const envConfig = dotenv.parse(envContent);
  
  // Update version values
  envConfig.NEXT_PUBLIC_APP_VERSION = packageVersion;
  envConfig.NEXT_PUBLIC_GIT_COMMIT_HASH = gitCommitHash;
  
  // Convert back to string format
  const newEnvContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  // Write updated .env file
  fs.writeFileSync('./.env', newEnvContent);

  console.log('Version info generated:', versionInfo);
};

createVersionInfo();