import React from 'react';
import { DietPlan as DietPlanType } from '../types';
import './DietPlan.css';

interface DietPlanProps {
  dietPlan: DietPlanType;
}

const DietPlan: React.FC<DietPlanProps> = ({ dietPlan }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDisplayContent = (plan: string) => {
    let content = plan;
    if (content.includes("'''")) {
      content = content.replace(/'''/g, '');
    }
    return content;
  };

  return (
    <div className="diet-plan-section">
      <div className="diet-plan-header">
        <h2 className="diet-plan-title">Your 7-Day Diet Plan</h2>
        <p className="diet-plan-subtitle">
          Generated for: {dietPlan.email} • {formatDate(dietPlan.createdAt)}
        </p>
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px',
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
        fontSize: '14px',
        lineHeight: '1.6'
      }}>
        {getDisplayContent(dietPlan.plan)}
      </div>
    </div>
  );
};

export default DietPlan;
