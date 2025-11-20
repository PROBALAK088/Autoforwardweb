
import { User } from '../types';

interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

export const loginUser = async (telegramId: string, password: string): Promise<AuthResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const usersStr = localStorage.getItem('users');
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find((u: any) => u.telegramId === telegramId && u.password === password);
  
  if (user) {
     return { 
       success: true, 
       message: 'Login successful',
       user: { id: user.id, username: user.username, telegramId: user.telegramId }
     };
  }
  return { success: false, message: 'Invalid credentials' };
};

export const registerUser = async (username: string, telegramId: string, password: string): Promise<AuthResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const usersStr = localStorage.getItem('users');
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  if (users.find((u: any) => u.telegramId === telegramId)) {
    return { success: false, message: 'User already exists' };
  }
  
  const newUser = {
    id: Date.now().toString(),
    username,
    telegramId,
    password
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  return { success: true, message: 'Registration successful' };
};

// This service is deprecated for the Poster Extractor version
// Keeping simplified local storage helper just in case
export const saveHistory = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};
