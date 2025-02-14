import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

// Password hashing
export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const comparePasswords = (password: string, hash: string) => 
  bcrypt.compare(password, hash);

// JWT handling
export const createJWT = (userId: string) => 
  new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(new TextEncoder().encode(process.env.JWT_SECRET!));

export const verifyJWT = (token: string) => 
  jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
