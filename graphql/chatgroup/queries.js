import { gql } from "@apollo/client";

export const GET_CHATGROUPS = gql`
  query chatgroups($user_id: ID!, $first: Int, $after: String) {
    chatgroups(user_id: $user_id, first: $first, after: $after) {
      edges {
        node {
          id
          chatgroup_name
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