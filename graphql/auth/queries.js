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
      locale
      alert
      is_online
      phone
      position
      group_name
      role_name
    }
  }
`;
