import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '../store/useAuthStore';

const endpoint =
  import.meta.env.VITE_GRAPHQL_URL ||
  (import.meta.env.DEV ? 'http://localhost:4000/graphql' : 'https://toy-store-backend-kv7o.onrender.com/graphql');

export const getGqlClient = () => {
  const token = useAuthStore.getState().token;
  return new GraphQLClient(endpoint, {
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });
};
