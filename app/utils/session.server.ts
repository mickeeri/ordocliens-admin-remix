import { z } from 'zod';
import { camelizeKeys } from 'humps';
import R from 'ramda';
import { createCookieSessionStorage, redirect } from '@remix-run/node';

type Credentials = {
  email: string;
  password: string;
};

const API_BASE_URL = 'https://ordocliens-api-staging.herokuapp.com';

const AuthResponse = z.object({
  authToken: z.string(),
  user: z.object({
    id: z.number(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
  }),
});

const makeFetchRequest =
  (method: 'GET' | 'POST') => (path: string, body?: unknown) => {
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });
  };

const post = makeFetchRequest('POST');

const jsonParse = (res: Response) => res.json();

const handleError = async (res: Response) => {
  if (!res.ok) {
    throw { status: res.status, ...(await jsonParse(res)) };
  }

  return res;
};

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET must be set');
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'ordocliens_admin_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

export const authenticate = (credentials: Credentials) => {
  return post('/v1/authenticate', credentials)
    .then(handleError)
    .then(jsonParse)
    .then(R.prop('auth'))
    .then(camelizeKeys)
    .then(AuthResponse.parse)
    .then(async ({ authToken }) => {
      const session = await storage.getSession();
      session.set('authToken', authToken);
      return redirect('/login', {
        headers: { 'Set-Cookie': await storage.commitSession(session) },
      });
    });
};

// export async function createUserSession(userId: string, redirectTo: string) {
//   const session = await storage.getSession();
//   session.set("userId", userId);
//   return redirect(redirectTo, {
//     headers: {
//       "Set-Cookie": await storage.commitSession(session),
//     },
//   });
// }
