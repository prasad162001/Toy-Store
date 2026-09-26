import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '../store/useAuthStore';

export const graphqlEndpoint =
  import.meta.env.VITE_GRAPHQL_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/graphql' : 'https://toy-store-backend-kv7o.onrender.com/graphql');

export const apiEndpoint = graphqlEndpoint.replace(/\/graphql\/?$/, '');

export const getGqlClient = () => {
  const token = useAuthStore.getState().token;
  return new GraphQLClient(graphqlEndpoint, {
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });
};

export async function uploadProductImages(productId: string, files: File[], token: string) {
  const body = new FormData();
  files.forEach((file) => body.append('images', file));
  const response = await fetch(`${apiEndpoint}/products/${productId}/images`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.message || 'Image upload failed');
  }
  return response.json();
}
