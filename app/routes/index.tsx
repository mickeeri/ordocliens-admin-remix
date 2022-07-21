import type { LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { getAuthToken } from '../utils/session.server';

export const loader: LoaderFunction = async ({ request }) => {
  try {
    await getAuthToken(request);
    return redirect('/dashboard');
  } catch (error) {
    return redirect('/login');
  }
};
