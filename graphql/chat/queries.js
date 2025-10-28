import { gql } from "@apollo/client";

export const GET_CHATS = gql`
  query chats($chatgroup_id: ID, $user_id: ID!, $first: Int, $after: String) {
    chats(chatgroup_id: $chatgroup_id, user_id: $user_id, first: $first, after: $after) {
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