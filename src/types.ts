export type UserRole = 'client' | 'trainer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface TrainingSession {
  id: string;
  title: string;
  date: string;
  duration: string;
  type: string;
  status: 'upcoming' | 'completed' | 'cancelled';
}

export interface MessageUpdate {
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
}
