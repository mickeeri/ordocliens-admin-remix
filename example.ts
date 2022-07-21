import R from 'ramda';
import fetch from 'node-fetch';

type Post = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

const postsUrl = 'https://jsonplaceholder.typicode.com/posts/';

const makeFetchRequest = (method: 'GET') => {
  return (url: string) => {
    return () => fetch(url, { method });
  };
};

const get = makeFetchRequest('GET');

const getPosts = get(postsUrl);

const pickRandomPost = (array: Post[]) =>
  array[Math.floor(Math.random() * array.length)];

const fetchPost = (id: number) => fetch(`${postsUrl}/${id}`);

getPosts()
  .then((res) => res.json())
  .then(pickRandomPost)
  .then(R.prop('id'))
  .then(fetchPost)
  .then((res) => res.json())
  .then((post) => {
    post;
  });
