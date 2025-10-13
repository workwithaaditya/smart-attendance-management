import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';

export async function getUserSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function getUserId() {
  const session = await getUserSession();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  return session.user.id;
}
