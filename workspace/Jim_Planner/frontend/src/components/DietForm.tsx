import React, { useState } from 'react';
import { FoodItem, DietRequest } from '../types';
import './DietForm.css';

interface DietFormProps {
  onSubmit: (data: DietRequest) => void;
  loading: boolean;
}

const DietForm: React.FC<DietFormProps> = ({ onSubmit, loading }) => {
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
    <div className="diet-form-container">
      <h2 className="diet-form-title">Create Your Diet Plan</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="form-group">
          <div className="food-items-header">
            <label className="form-label">Food Items</label>
            <button
              type="button"
              onClick={addFoodItem}
              className="add-food-btn"
            >
              Add Food Item
            </button>
          </div>

          <div>
            {foodItems.map((item, index) => (
              <div key={item.id} className="food-row">
                <span className="food-number">{index + 1}.</span>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => updateFoodItem(item.id, 'name', e.target.value)}
                  className="input-field food-input"
                  placeholder="Food name (e.g., Chicken Breast)"
                />
                <input
                  type="number"
                  value={item.grams || ''}
                  onChange={(e) => updateFoodItem(item.id, 'grams', parseInt(e.target.value) || 0)}
                  className="input-field grams-input"
                  placeholder="grams"
                  min="0"
                />
                <span className="grams-label">g</span>
                {foodItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFoodItem(item.id)}
                    className="btn-remove"
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
          className="btn-generate"
        >
          {loading ? 'Generating...' : 'Generate Your Personalized Diet Plan 🚀'}
        </button>
      </form>
    </div>
  );
};

export default DietForm;
