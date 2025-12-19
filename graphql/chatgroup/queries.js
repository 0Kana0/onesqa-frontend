import { gql } from "@apollo/client";

export const GET_CHATGROUPS = gql`
  query chatgroups(
    $id: ID, 
    $user_id: ID!, 
    $first: Int, 
    $after: String,
    $search: String
  ) {
    chatgroups(
      id: $id, 
      user_id: $user_id, 
      first: $first, 
      after: $after,
      search: $search
    ) {
      edges {
        node {
          id
          chatgroup_name
          createdAt
          updatedAt
          chat {
            id
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

export const GET_CHATGROUP = gql`
  query chatgroup($id: ID!, $user_id: ID) {
    chatgroup(id: $id, user_id: $user_id) {
      id
      chatgroup_name
      createdAt
      updatedAt
    }
  }
`;