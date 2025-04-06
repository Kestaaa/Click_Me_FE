const fs = require('fs');
const { execSync } = require('child_process');

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

// Create version info
const createVersionInfo = () => {
  const { gitCommitHash, gitBranch } = getGitInfo();
  const packageVersion = getPackageVersion();
  const timestamp = new Date().toISOString();

  const versionInfo = {
    version: packageVersion,
    gitCommitHash,
    gitBranch,
    buildTime: timestamp
  };

  // Write to a file that can be imported in the app
  fs.writeFileSync('./src/config/version.json', JSON.stringify(versionInfo, null, 2));
  console.log('Version info generated:', versionInfo);
};

createVersionInfo();