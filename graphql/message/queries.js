import { gql } from "@apollo/client";

export const GET_MESSAGES = gql`
  query messages($chat_id: ID!, $user_id: ID) {
    messages(chat_id: $chat_id, user_id: $user_id) {
      id
      role
      message_type
      text
      createdAt
      updatedAt
      files {
        id
        file_name
        original_name
        stored_path
      }
    }
  }
`;

