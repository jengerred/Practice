import  connectDB  from '@/lib/db';
import { User } from '@/models/User';
import { createJWT } from '@/lib/auth';
import { cookies } from 'next/headers';
import { z } from 'zod';

export const config = {
  runtime: 'nodejs', // Use Node.js runtime instead of Edge
};

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name too long')
});

export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Parse and validate request body
    const requestData = await request.json();
    const validationResult = registerSchema.safeParse(requestData);
    
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message
      }));
      
      return new Response(JSON.stringify({ 
        errors: errorMessages 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { email, password, firstName } = validationResult.data;

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ 
        errors: [{ field: 'email', message: 'User already exists' }]
      }), { 
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create new user (password hashed in pre-save hook)
    const user = await User.create({ 
      email, 
      password,
      firstName 
    });

    // Generate JWT
    const token = await createJWT(user._id.toString());

    // Set secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });

    // Return success response
    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({
      errors: [{ message: 'Internal server error' }]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
