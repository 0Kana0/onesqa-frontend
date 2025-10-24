import { gql } from "@apollo/client";

export const USER_ONLINE = gql`
  mutation setUserOnline($user_id: ID!) {
    setUserOnline(user_id: $user_id) {
      user_id
      is_online
      username
    }
  }
`;

export const USER_OFFLINE = gql`
  mutation setUserOffline($user_id: ID!) {
    setUserOffline(user_id: $user_id) {
      user_id
      is_online
      username
    }
  }
`;
