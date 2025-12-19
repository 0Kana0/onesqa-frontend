import { gql } from "@apollo/client";

export const UPDATE_GROUP = gql`
  mutation updateGroup($id: ID!, $input: GroupInput!) {
    updateGroup(id: $id, input: $input) {
      id
      name
    }
  }
`;

export const DELETE_GROUP = gql`
  mutation deleteGroup($id: ID!) {
    deleteGroup(id: $id)
  }
`;