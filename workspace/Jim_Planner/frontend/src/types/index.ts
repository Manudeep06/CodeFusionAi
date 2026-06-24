export interface FoodItem {
  id: string;
  name: string;
  grams: number;
}

export interface DietRequest {
  email: string;
  items: { name: string; grams: number }[];
}

export interface DayPlan {
  day: string;
  meals: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
}

export interface DietPlan {
  id: string;
  email: string;
  createdAt: string;
  plan: string;
}
