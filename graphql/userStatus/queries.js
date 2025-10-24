import { gql } from "@apollo/client";

export const ONLINE_USERS = gql`
  query onlineUsers {
    onlineUsers {
      user_id
      username
      is_online
    }
  }
`;
