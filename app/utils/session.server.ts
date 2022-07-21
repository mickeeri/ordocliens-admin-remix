import { z } from 'zod';
import { camelizeKeys } from 'humps';
import R from 'ramda';
import type { Session } from '@remix-run/node';
import { createCookieSessionStorage, redirect } from '@remix-run/node';

type Credentials = {
  email: string;
  password: string;
};

const API_BASE_URL = 'https://ordocliens-api-staging.herokuapp.com';

const UserSchema = z.object({
  id: z.number(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['superadmin', 'user', 'admin']),
});

const AuthResponse = z.object({
  authToken: z.string(),
  user: UserSchema,
});

const makeFetchRequest =
  (method: 'GET' | 'POST') =>
  (path: string, options?: { body?: unknown; authToken?: string }) => {
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.authToken
          ? { Authorization: `Bearer ${options.authToken}` }
          : undefined),
      },
      body: options?.body ? JSON.stringify(options.body) : null,
    });
  };

const post = makeFetchRequest('POST');
const get = makeFetchRequest('GET');

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

const setAuthCookie = async (authToken: string) => {
  const session = await storage.getSession();
  session.set('authToken', authToken);
  return redirect('/dashboard', {
    headers: { 'Set-Cookie': await storage.commitSession(session) },
  });
};

export const authenticate = (credentials: Credentials) => {
  return post('/v1/authenticate', { body: credentials })
    .then(handleError)
    .then(jsonParse)
    .then(R.prop('auth'))
    .then(camelizeKeys)
    .then(AuthResponse.parse)
    .then(R.prop('authToken'))
    .then(setAuthCookie);
};

const AuthToken = z.string();

type User = z.infer<typeof UserSchema>;

const requireSuperadmin = (user: User) => {
  if (user.role === 'superadmin') {
    return user;
  }

  throw new Error('User has to be superadmin');
};

const fetchCurrentUser = (authToken: string) =>
  get('/v1/current_user', { authToken });

export const getUser = (request: Request) => {
  return getAuthToken(request)
    .then(fetchCurrentUser)
    .then(handleError)
    .then(jsonParse)
    .then(R.prop('user'))
    .then(camelizeKeys)
    .then(UserSchema.parse)
    .then(requireSuperadmin);
};

const getAuthTokenFromSession = ({ get }: Session) => get('authToken');

export function getAuthToken(request: Request) {
  return storage
    .getSession(request.headers.get('Cookie'))
    .then(getAuthTokenFromSession)
    .then(AuthToken.parse);
}

export async function logout(request: Request) {
  const session = await storage.getSession(request.headers.get('Cookie'));

  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}
