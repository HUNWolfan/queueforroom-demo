import bcrypt from 'bcryptjs';
import { query } from '~/db.server';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export async function register({
  email,
  password,
  firstName,
  lastName,
  preferredLanguage = 'en',
}: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: string;
}): Promise<User | null> {
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, preferred_language) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, firstName, lastName, preferredLanguage]
    );

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
    };
  } catch (error: any) {
    if (error.code === '23505') {
      return null;
    }
    throw error;
  }
}

export async function login({
  email,
  password,
}: {
  email: string;
  password: string;
}): Promise<User | null> {
  // Normalize email to lowercase for case-insensitive comparison
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await query(
    'SELECT * FROM users WHERE LOWER(email) = $1',
    [normalizedEmail]
  );

  const user = result.rows[0];
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await query(
    'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
    [id]
  );

  const user = result.rows[0];
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    role: user.role,
  };
}
