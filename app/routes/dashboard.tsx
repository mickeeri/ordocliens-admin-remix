import type { LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { getUser } from '~/utils/session.server';

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  try {
    return json({ user: await getUser(request) });
  } catch (error) {
    console.error(error);
    return redirect('/login');
  }
};

export default function Dashboard() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <pre>{JSON.stringify(data)}</pre>
      <h1>
        Welcome {data.user.firstName} {data.user.lastName}
      </h1>
    </div>
  );
}
