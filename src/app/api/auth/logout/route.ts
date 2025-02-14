import { cookies } from 'next/headers';

export async function POST() {
  // Properly await the cookies() function
  const cookieStore = await cookies();
  cookieStore.delete('token'); // Delete the token cookie

  // Redirect to the login page after logout
  return new Response(null, { status: 302, headers: { Location: '/login' } });
}
