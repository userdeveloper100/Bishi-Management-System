import { api } from './client';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: SessionUser;
}

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export async function register(name: string, email: string, password: string): Promise<RegisteredUser> {
  const { data } = await api.post<RegisteredUser>('/auth/register', { name, email, password });
  return data;
}
