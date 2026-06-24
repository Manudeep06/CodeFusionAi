# 💪 Gym Diet Planner

A full-stack web application that generates personalized 7-day diet plans based on user's favorite foods. Built with React frontend and Node.js backend.

## Features

### Frontend (React)
- ✅ Modern, responsive UI with fitness-themed design (green/blue accents)
- ✅ Dynamic form to add/remove multiple food items
- ✅ Email input and quantity specification in grams
- ✅ Loading spinner during API processing
- ✅ Beautiful card-based display of generated diet plans
- ✅ History section to view previous diet plans
- ✅ Mobile-friendly responsive design

### Backend (Node.js/Express)
- ✅ RESTful API with CORS enabled
- ✅ POST `/generate-diet` endpoint
- ✅ Input validation and error handling
- ✅ Mock AI response with realistic diet data
- ✅ Structured 7-day meal plans (breakfast, lunch, dinner, snacks)

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- TailwindCSS for styling
- Axios for API calls
- Functional components with hooks

**Backend:**
- Node.js with Express
- CORS middleware
- JSON responses

## Project Structure

```
gym-diet-planner/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DietForm.tsx
│   │   │   ├── DietPlan.tsx
│   │   │   ├── History.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── tailwind.config.js
├── backend/
│   ├── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

1. **Start both servers** (backend on port 5000, frontend on port 3000)
2. **Open your browser** and navigate to `http://localhost:3000`
3. **Enter your email address**
4. **Add food items** with their quantities in grams:
   - Click "Add Food Item" to add more items
   - Click "Remove" to delete items (minimum 1 required)
5. **Click "Generate Diet Plan"** to create your personalized 7-day plan
6. **View your diet plan** with meals for each day
7. **Access previous plans** in the History section

## API Endpoints

### POST `/generate-diet`

**Request Body:**
```json
{
  "email": "user@example.com",
  "items": [
    {
      "name": "Chicken Breast",
      "grams": 200
    },
    {
      "name": "Brown Rice",
      "grams": 150
    }
  ]
}
```

**Response:**
```json
{
  "id": "1640995200000",
  "email": "user@example.com",
  "createdAt": "2024-01-01T12:00:00.000Z",
  "plan": [
    {
      "day": "Monday",
      "meals": {
        "breakfast": ["Oatmeal with berries and nuts", "Greek yogurt with granola"],
        "lunch": ["Grilled chicken salad", "Quinoa bowl with vegetables"],
        "dinner": ["Grilled salmon with roasted vegetables"],
        "snacks": ["Apple slices with almond butter", "Protein bar"]
      }
    }
  ]
}
```

### GET `/health`

Health check endpoint to verify the server is running.

## Features in Detail

### Dynamic Food Form
- Add unlimited food items
- Specify quantities in grams
- Remove items with validation (minimum 1 required)
- Real-time form validation

### Diet Plan Display
- 7-day meal plans with color-coded meal sections
- Breakfast (🌅), Lunch (☀️), Dinner (🌆), Snacks (🍎)
- Responsive grid layout for mobile and desktop

### History Management
- View all previously generated diet plans
- Click to load and view any previous plan
- Timestamps for each plan

### Responsive Design
- Mobile-first approach
- TailwindCSS utility classes
- Adaptive layouts for different screen sizes

## Future Enhancements

- [ ] Real AI integration for diet generation
- [ ] User authentication and profile management
- [ ] Nutritional information tracking
- [ ] Meal customization options
- [ ] PDF export for diet plans
- [ ] Grocery list generation
- [ ] Progress tracking features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

---

**Happy eating and stay strong! 💪🥗**
