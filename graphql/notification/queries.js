import { gql } from "@apollo/client";

export const MY_NOTIFICATIONS = gql`
  query myNotifications($user_id: ID!) {
    myNotifications(user_id: $user_id) {
      id
      message
      title
      type
      user_id
      createdAt
    }
  }
`;