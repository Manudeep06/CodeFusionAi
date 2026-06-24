import React from 'react';

const AnalyticsStrip: React.FC = () => {
  const stats = [
    {
      label: 'Total Calories',
      value: '17,150',
      icon: '🔥',
      iconClass: 'calories'
    },
    {
      label: 'Protein',
      value: '875g',
      icon: '💪',
      iconClass: 'protein'
    },
    {
      label: 'Carbs',
      value: '1,260g',
      icon: '🌾',
      iconClass: 'carbs'
    },
    {
      label: 'Fat',
      value: '455g',
      icon: '🥑',
      iconClass: 'fat'
    }
  ];

  return (
    <div className="analytics-strip">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className={`stat-icon ${stat.iconClass}`}>
            {stat.icon}
          </div>
          <div className="stat-value">{stat.value}</div>
          <div className="stat-label">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};

export default AnalyticsStrip;
