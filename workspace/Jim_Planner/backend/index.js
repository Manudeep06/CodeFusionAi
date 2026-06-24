const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
console.log("Server is running on port", PORT);

// Middleware
app.use(cors());
app.use(express.json());

// Mock AI diet plan generator
const generateMockDietPlan = (email, foodItems) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const mealTemplates = {
    breakfast: [
      'Oatmeal with berries and nuts',
      'Greek yogurt with granola',
      'Scrambled eggs with whole wheat toast',
      'Protein smoothie with banana',
      'Avocado toast with eggs',
      'Cottage cheese with fruit',
      'Whole grain pancakes with syrup'
    ],
    lunch: [
      'Grilled chicken salad',
      'Quinoa bowl with vegetables',
      'Turkey sandwich on whole grain bread',
      'Salmon with sweet potato',
      'Lentil soup with whole grain bread',
      'Tuna salad with mixed greens',
      'Brown rice with stir-fried vegetables'
    ],
    dinner: [
      'Grilled salmon with roasted vegetables',
      'Lean beef with quinoa and broccoli',
      'Chicken stir-fry with brown rice',
      'Baked cod with asparagus',
      'Turkey meatballs with whole wheat pasta',
      'Grilled tofu with vegetable skewers',
      'Pork chops with sweet potato mash'
    ],
    snacks: [
      'Apple slices with almond butter',
      'Protein bar',
      'Mixed nuts and seeds',
      'Greek yogurt',
      'Carrot sticks with hummus',
      'Hard-boiled eggs',
      'Rice cakes with avocado'
    ]
  };

  const getRandomMeals = (mealArray, count = 3) => {
    const shuffled = [...mealArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const plan = days.map(day => ({
    day,
    meals: {
      breakfast: getRandomMeals(mealTemplates.breakfast),
      lunch: getRandomMeals(mealTemplates.lunch),
      dinner: getRandomMeals(mealTemplates.dinner),
      snacks: getRandomMeals(mealTemplates.snacks, 2)
    }
  }));

  return {
    id: Date.now().toString(),
    email,
    createdAt: new Date().toISOString(),
    plan
  };
};

// Routes
app.post('/generate-diet', (req, res) => {
  try {
    const { email, items } = req.body;

    // Validate input
    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Invalid input. Please provide email and at least one food item.'
      });
    }

    // Validate food items
    const validItems = items.filter(item =>
      item.name && typeof item.name === 'string' &&
      item.grams && typeof item.grams === 'number' && item.grams > 0
    );

    if (validItems.length === 0) {
      return res.status(400).json({
        error: 'No valid food items provided. Each item must have a name and positive gram amount.'
      });
    }

    // Generate mock diet plan (simulating AI processing)
    setTimeout(() => {
      const dietPlan = generateMockDietPlan(email, validItems);
      res.json(dietPlan);
    }, 2000); // Simulate 2 second processing time

  } catch (error) {
    console.error('Error generating diet plan:', error);
    res.status(500).json({
      error: 'Internal server error. Please try again later.'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
