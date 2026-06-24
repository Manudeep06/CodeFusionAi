import axios from 'axios';
import { DietRequest, DietPlan } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const generateDiet = async (data: DietRequest): Promise<DietPlan> => {
  const response = await api.post('/generate-diet', data);
  return response.data;
};
