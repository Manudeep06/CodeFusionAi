import React from 'react';
import { DietPlan as DietPlanType } from '../types';

interface PremiumDietDisplayProps {
  dietPlan: DietPlanType;
}

const PremiumDietDisplay: React.FC<PremiumDietDisplayProps> = ({ dietPlan }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper to clean up the python code string if possible, or just display as is
  const getDisplayContent = (plan: string) => {
    // Basic cleaning to remove the python wrapper if present
    let content = plan;
    if (content.includes("'''")) {
      content = content.replace(/'''/g, '');
    }
    return content;
  };

  return (
    <div className="diet-table-container">
      <h2 className="diet-table-title">Your Personalized Diet Plan</h2>
      <p className="diet-table-subtitle">
        Generated for: <span style={{ fontWeight: '600', color: '#1e293b' }}>{dietPlan.email}</span> • {formatDate(dietPlan.createdAt)}
      </p>

      <div style={{
        backgroundColor: '#f8fafc',
        padding: '24px',
        borderRadius: '16px',
        border: '1px solid #e2e8f0',
        marginTop: '20px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#334155'
      }}>
        {getDisplayContent(dietPlan.plan)}
      </div>
    </div>
  );
};

export default PremiumDietDisplay;
