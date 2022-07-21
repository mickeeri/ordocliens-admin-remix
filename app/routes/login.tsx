import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { login } from '~/utils/session.server';
import { z } from 'zod';

const Credentials = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const rawEmail = form.get('email');
  const rawPassword = form.get('password');

  const credentials = Credentials.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!credentials.success) {
    console.error(credentials.error);
    return json({ status: 400 });
  }

  const email = credentials.data.email;
  const password = credentials.data.password;

  const result = await login({ email, password });

  if (!result.user) {
    return json(result, { status: 400 });
  }

  return result;
};

export default function Login() {
  const formData = useActionData<ActionData>();

  return (
    <div>
      <pre>{JSON.stringify(formData)}</pre>

      <h1>Logga in</h1>
      <Form method="post">
        <label htmlFor="email">E-post</label>
        <input
          type="text"
          name="email"
          id="email"
          defaultValue={'micke_eri@hotmail.com'}
        />

        <label htmlFor="password">Lösenord</label>
        <input
          type="password"
          name="password"
          id="password"
          defaultValue="password"
        />

        <button type="submit">Logga in</button>
      </Form>
    </div>
  );
}
