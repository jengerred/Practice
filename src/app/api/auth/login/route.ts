import { createJWT } from '@/lib/auth';
import  connectDB  from '@/lib/db';
import { User } from '@/models/User';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const config = {
  runtime: 'nodejs', // Use Node.js runtime instead of Edge
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Validate input
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input',
        details: result.error.errors 
      }), { status: 400 });
    }

    const { email, password } = result.data;

  // Find user with password selected
  const user = await User.findOne({ email }).select('+password');
    
  if (!user || !(await user.comparePassword(password))) {
    return new Response(JSON.stringify({ 
      error: 'Invalid credentials' 
    }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
    // Create JWT
    const token = await createJWT(user._id.toString());

  // Set secure cookie - FIXED COOKIE HANDLING
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 2, // 2 hours
    path: '/',
  });

  return new Response(JSON.stringify({ 
    firstName: user.firstName,
    email: user.email
  }), { 
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });

} catch (error) {
  console.error('Login error:', error);
  return new Response(JSON.stringify({ 
    error: 'Login failed' 
  }), { 
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });

  }
}
