import { gql } from "@apollo/client";

export const GET_ME = gql`
  query me {
    me {
      id
      firstname
      lastname
      ai_access
      color_mode
      email
      login_type
      phone
      position
      group_name
      role_name
      username
    }
  }
`;
