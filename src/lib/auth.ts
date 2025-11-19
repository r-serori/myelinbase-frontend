'use client';
import { fetchAuthSession } from 'aws-amplify/auth';

export async function getJwt(): Promise<string> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error('No ID token');
  return token;
}


