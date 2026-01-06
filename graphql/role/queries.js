import { gql } from "@apollo/client";

export const GET_ROLES = gql`
  query roles {
    roles {
      id
      role_name_th
      role_name_en
    }
  }
`;

export const GET_ROLE = gql`
  query role($id: ID!) {
    role(id: $id) {
      id
      role_name_th
      role_name_en
    }
  }
`;

