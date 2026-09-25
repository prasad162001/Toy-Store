import { GraphQLClient } from 'graphql-request';
import { useAuthStore } from '../store/useAuthStore';

// const endpoint = 'http://localhost:4000/graphql';
const endpoint = 'https://toy-store-backend-kv7o.onrender.com/graphql';

export const getGqlClient = () => {
  const token = useAuthStore.getState().token;
  return new GraphQLClient(endpoint, {
    headers: {
      authorization: token ? `Bearer ${token}` : '',
    },
  });
};
