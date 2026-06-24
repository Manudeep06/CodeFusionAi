import React from 'react';

const LoadingSpinnerSimple: React.FC = () => {
  return (
    <div className="loading-simple">
      <div className="loading-spinner"></div>
      <div className="loading-text">Generating your personalized diet plan...</div>
    </div>
  );
};

export default LoadingSpinnerSimple;
