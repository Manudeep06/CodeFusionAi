import React, { useState } from 'react';
import { FoodItem, DietRequest } from '../types';

interface PremiumFormPanelProps {
  onSubmit: (data: DietRequest) => void;
  loading: boolean;
}

const PremiumFormPanel: React.FC<PremiumFormPanelProps> = ({ onSubmit, loading }) => {
  const [email, setEmail] = useState('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: '1', name: '', grams: 0 }
  ]);

  const addFoodItem = () => {
    const newId = Date.now().toString();
    setFoodItems([...foodItems, { id: newId, name: '', grams: 0 }]);
  };

  const removeFoodItem = (id: string) => {
    if (foodItems.length > 1) {
      setFoodItems(foodItems.filter(item => item.id !== id));
    }
  };

  const updateFoodItem = (id: string, field: 'name' | 'grams', value: string | number) => {
    setFoodItems(foodItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = foodItems.filter(item => item.name.trim() && item.grams > 0);
    if (!email.trim() || validItems.length === 0) {
      alert('Please enter your email and at least one valid food item');
      return;
    }

    const requestData: DietRequest = {
      email: email.trim(),
      items: validItems.map(item => ({
        name: item.name.trim(),
        grams: item.grams
      }))
    };

    onSubmit(requestData);
  };

  return (
    <div className="form-panel">
      <h2 className="form-title">Create Your Diet Plan</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label className="form-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-input"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <label className="form-label">Food Items</label>
            <button
              type="button"
              onClick={addFoodItem}
              className="add-food-btn"
            >
              <span>+</span>
              <span>Add Food Item</span>
            </button>
          </div>

          <div>
            {foodItems.map((item, index) => (
              <div key={item.id} className="food-item-row">
                <span className="food-number">{index + 1}</span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateFoodItem(item.id, 'name', e.target.value)}
                  className="form-input"
                  placeholder="Food name (e.g., Chicken Breast)"
                  style={{ marginBottom: 0 }}
                />
                <input
                  type="number"
                  value={item.grams || ''}
                  onChange={(e) => updateFoodItem(item.id, 'grams', parseInt(e.target.value) || 0)}
                  className="form-input"
                  placeholder="grams"
                  min="0"
                  style={{ marginBottom: 0, width: '140px' }}
                />
                <span style={{ 
                  color: '#64748b', 
                  fontWeight: '500',
                  fontSize: '14px',
                  width: '40px'
                }}>
                  g
                </span>
                {foodItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFoodItem(item.id)}
                    className="remove-btn"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="generate-btn"
        >
          {loading ? 'Generating Your Diet Plan...' : 'Generate Your Personalized Diet Plan 🚀'}
        </button>
      </form>
    </div>
  );
};

export default PremiumFormPanel;
