import React from 'react';
import { DietPlan as DietPlanType } from '../types';

interface DietTableProps {
  dietPlan: DietPlanType;
}

const DietTable: React.FC<DietTableProps> = ({ dietPlan }) => {
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
    <div className="diet-table-card">
      <h2 className="diet-title">Your Personalized 7-Day Diet Plan</h2>
      <p style={{
        color: '#64748b',
        fontSize: '16px',
        marginBottom: '32px',
        fontWeight: '400'
      }}>
        Generated for: <span style={{ fontWeight: '600', color: '#1f2937' }}>{dietPlan.email}</span> • {formatDate(dietPlan.createdAt)}
      </p>

      <div style={{
        backgroundColor: '#f1f5f9',
        padding: '24px',
        borderRadius: '12px',
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

export default DietTable;
