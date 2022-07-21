import type { ActionFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useActionData, useCatch } from '@remix-run/react';
import { z } from 'zod';
import { authenticate } from '../utils/session.server';

const Credentials = z.object({
  email: z.string().min(1, "Email can't be empty"),
  password: z.string().min(1, "Password can't be empty"),
});

type ActionData = {
  formErrors?: string[];
  fieldErrors?: {
    email?: string[] | undefined;
    password?: string[] | undefined;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
  };
};

const ErrorResponse = z.object({
  message: z.string(),
  status: z.number(),
});

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const rawEmail = form.get('email');
  const rawPassword = form.get('password');

  const credentials = Credentials.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!credentials.success) {
    return json(credentials.error.flatten());
  }

  const email = credentials.data.email;
  const password = credentials.data.password;

  try {
    return await authenticate({ email, password });
  } catch (error) {
    const parsedError = ErrorResponse.safeParse(error);

    if (parsedError.success) {
      const { message, status } = parsedError.data;
      return json(
        { formErrors: [`${message}. Status: ${status}`] },
        { status },
      );
    }

    return json({ formErrors: ['Unknown error'] }, { status: 500 });
  }
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

        {formData?.fieldErrors?.email?.map((message) => (
          <p key={message}>{message}</p>
        ))}

        <label htmlFor="password">Lösenord</label>
        <input
          type="password"
          name="password"
          id="password"
          defaultValue="password"
        />

        {formData?.fieldErrors?.password?.map((message) => (
          <p key={message}>{message}</p>
        ))}

        <div>
          {formData?.formErrors?.map((error) => (
            <p key={error}>{error}</p>
          ))}

          <button type="submit">Logga in</button>
        </div>
      </Form>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <div className="error-container">
      <pre>{JSON.stringify(caught)}</pre>
    </div>
  );
}
