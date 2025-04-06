import React from 'react';

interface VersionInfoProps {
  className?: string;
}

const VersionInfo: React.FC<VersionInfoProps> = ({ className }) => {
  const repoUrl = "https://github.com/CLICK-ME-ON-SOL/Click_Me_FE"; // Update with your actual GitHub repo

  // This would normally be populated by your build process
  const versionInfo = {
    version: process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0',
    gitCommitHash: process.env.NEXT_PUBLIC_GIT_COMMIT_HASH || 'development'
  };
  
  return (
    <div className={className}>
      <a 
        href={`${repoUrl}/commit/${versionInfo.gitCommitHash}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-gray-300 transition"
      >
        v{versionInfo.version} ({versionInfo.gitCommitHash})
      </a>
    </div>
  );
};

export default VersionInfo;