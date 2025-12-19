import { gql } from "@apollo/client";

export const GET_CHATS = gql`
  query chats(
    $chatgroup_id: ID
    $user_id: ID!
    $first: Int
    $after: String
    $search: String
    $chatgroupMode: String
  ) {
    chats(
      chatgroup_id: $chatgroup_id
      user_id: $user_id
      first: $first
      after: $after
      search: $search
      chatgroupMode: $chatgroupMode
    ) {
      edges {
        node {
          id
          chat_name
          createdAt
          updatedAt
          ai {
            model_type
          }
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
  query chat($id: ID!, $user_id: ID) {
    chat(id: $id, user_id: $user_id) {
      id
      ai_id
      chat_name
      chatgroup_id
      createdAt
      updatedAt
      ai {
        model_type
      }
    }
  }
`;
