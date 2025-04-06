import React from 'react';
import versionInfo from '../../config/version.json';

interface VersionInfoProps {
  className?: string;
}

const VersionInfo: React.FC<VersionInfoProps> = ({ className }) => {
  const repoUrl = "https://github.com/yourusername/button-game-front-end"; // Replace with your actual GitHub repo URL
  
  return (
    <div className={className}>
      <a 
        href={`${repoUrl}/commit/${versionInfo.gitCommitHash}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-gray-500 hover:text-gray-300 transition"
      >
        v{versionInfo.version} ({versionInfo.gitCommitHash})
      </a>
    </div>
  );
};

export default VersionInfo;