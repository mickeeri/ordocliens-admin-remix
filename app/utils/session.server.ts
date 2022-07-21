import { json } from '@remix-run/node';
import { string, z } from 'zod';
import { camelizeKeys } from 'humps';

type Credentials = {
  email: string;
  password: string;
};

const API_BASE_URL = 'https://ordocliens-api-staging.herokuapp.com';

const AuthResponse = z.object({
  auth: z.object({
    authToken: z.string(),
    user: z.object({
      email: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    }),
  }),
});

const ErrorResponse = z.object({
  message: z.string(),
  status: z.number(),
});

export const login = async (credentials: Credentials) => {
  const response = await fetch(`${API_BASE_URL}/v1/authenticate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth: credentials,
    }),
  });

  const rawData = camelizeKeys(await response.json());

  if (!response.ok) {
    const parsedError = ErrorResponse.safeParse({
      ...rawData,
      status: response.status,
    });

    if (parsedError.success) {
      return json(parsedError.data);
    }

    return parsedError.error;
  }

  const data = AuthResponse.safeParse(rawData);

  if (data.success) {
    return json(data.data.auth);
  }

  return data.error;
};
