import React from 'react';
import { DietPlan as DietPlanType } from '../types';
import './History.css';

interface HistoryProps {
  dietPlans: DietPlanType[];
  onLoadPlan: (plan: DietPlanType) => void;
}

const History: React.FC<HistoryProps> = ({ dietPlans, onLoadPlan }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (dietPlans.length === 0) {
    return (
      <div className="history-section">
        <h2 className="history-header">Previous Diet Plans</h2>
        <div className="history-empty">
          <p>No previous diet plans found. Create your first diet plan above!</p>
          <div className="history-buttons">
            <button className="btn-secondary">Start Healthy</button>
            <button className="btn-blue">Track Progress</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-section">
      <h2 className="history-header">Previous Diet Plans</h2>
      
      <div>
        {dietPlans.map((plan) => (
          <div
            key={plan.id}
            className="history-item"
            onClick={() => onLoadPlan(plan)}
          >
            <div className="history-item-header">
              <div>
                <h3 className="history-item-title">{plan.email}</h3>
                <p className="history-item-meta">
                  {formatDate(plan.createdAt)} • {plan.plan.length} day plan
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLoadPlan(plan);
                }}
                className="btn-view"
              >
                View Plan
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default History;
