import React from 'react';

const PremiumLoadingSpinner: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <div className="loading-message">Generating your personalized diet plan...</div>
    </div>
  );
};

export default PremiumLoadingSpinner;
