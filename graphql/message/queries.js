import { gql } from "@apollo/client";

export const GET_MESSAGES = gql`
  query messages($chat_id: ID!) {
    messages(chat_id: $chat_id) {
      id
      role
      text
      createdAt
      updatedAt
    }
  }
`;

