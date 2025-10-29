import { gql } from "@apollo/client";

export const GET_CHATS = gql`
  query chats($chatgroup_id: ID, $user_id: ID!, $first: Int, $after: String, $search: String) {
    chats(chatgroup_id: $chatgroup_id, user_id: $user_id, first: $first, after: $after, search: $search) {
      edges {
        node {
          id
          chat_name
          createdAt
          updatedAt
        }
        cursor
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const GET_CHAT = gql`
  query chat($id: ID!) {
    chat(id: $id) {
      id
      ai_id
      createdAt
      updatedAt
    }
  }
`;