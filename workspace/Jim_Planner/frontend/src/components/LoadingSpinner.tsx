import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-message">Generating your diet plan...</div>
    </div>
  );
};

export default LoadingSpinner;
