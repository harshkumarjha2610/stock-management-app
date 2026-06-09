// Simple API helper for the mobile app with SecureStore persistence
import * as SecureStore from 'expo-secure-store';

const BASE = 'http://localhost:5000/api'; // adjust for emulator if needed (10.0.2.2)
const TOKEN_KEY = 'auth_token';

let token: string | null = null;

export const setToken = async (t: string | null) => {
  token = t;
  if (t) {
    await SecureStore.setItemAsync(TOKEN_KEY, t);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

export const init = async () => {
  try {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    token = t;
    return t;
  } catch (e) {
    return null;
  }
};

async function request(path: string, opts: { method?: string; body?: any } = {}) {
  const url = `${BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (e) {
    // no json
  }

  if (!res.ok) {
    const message = data?.message || 'API request failed';
    throw new Error(message);
  }

  return data?.data ?? null;
}

export const apiGet = (path: string) => request(path, { method: 'GET' });
export const apiPost = (path: string, body?: any) => request(path, { method: 'POST', body });
export const apiPut = (path: string, body?: any) => request(path, { method: 'PUT', body });
export const apiDelete = (path: string) => request(path, { method: 'DELETE' });

export default { init, setToken, apiGet, apiPost, apiPut, apiDelete };
