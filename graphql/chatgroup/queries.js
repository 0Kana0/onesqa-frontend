import { gql } from "@apollo/client";

export const GET_CHATGROUPS = gql`
  query chatgroups(
    $user_id: ID!, 
    $first: Int, 
    $after: String,
    $search: String
  ) {
    chatgroups(
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
  query chatgroup($id: ID!) {
    chatgroup(id: $id) {
      id
      chatgroup_name
      createdAt
      updatedAt
    }
  }
`;