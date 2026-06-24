import React, { useState } from 'react';

import PremiumFormPanel from './components/PremiumFormPanel';

import PremiumDietDisplay from './components/PremiumDietTable';

import PremiumLoadingSpinner from './components/PremiumLoadingSpinner';

import AnalyticsStrip from './components/AnalyticsStrip';

import { generateDiet } from './services/api';

import { DietRequest, DietPlan as DietPlanType } from './types';

import './App.css';



function App() {

  const [loading, setLoading] = useState(false);

  const [currentPlan, setCurrentPlan] = useState<DietPlanType | null>(null);



  const handleFormSubmit = async (data: DietRequest) => {

    setLoading(true);

    try {

      const dietPlan = await generateDiet(data);

      setCurrentPlan(dietPlan);

    } catch (error) {

      console.error('Error generating diet plan:', error);

      alert('Failed to generate diet plan. Please try again.');

    } finally {

      setLoading(false);

    }

  };



  return (

    <div className="container">

      {/* Hero Header */}

      <header className="hero-header">

        <h1>Gym Diet Planner 💪</h1>

        <p>Transform your favorite foods into personalized 7-day diet plans with AI-powered nutrition guidance</p>



        <div className="feature-badges">

          <div className="feature-badge">

            <span>✨</span>

            <span>Smart Nutrition</span>

          </div>

          <div className="feature-badge">

            <span>🎯</span>

            <span>Personalized Plans</span>

          </div>

          <div className="feature-badge">

            <span>🏆</span>

            <span>Expert Curated</span>

          </div>

        </div>

      </header>



      <main>

        {/* Form Panel */}

        <PremiumFormPanel onSubmit={handleFormSubmit} loading={loading} />



        {/* Loading State */}

        {loading && <PremiumLoadingSpinner />}



        {/* Analytics Strip */}

        {currentPlan && !loading && <AnalyticsStrip />}



        {/* Diet Plan Table */}

        {currentPlan && !loading && (

          <PremiumDietDisplay dietPlan={currentPlan} />

        )}

      </main>



      <footer className="footer">

        <p>🌱 Eat healthy, stay strong 💚</p>

      </footer>

    </div>

  );

}



export default App;

