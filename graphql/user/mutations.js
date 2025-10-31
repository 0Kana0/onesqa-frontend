import { gql } from "@apollo/client";

export const UPDATE_USER = gql`
  mutation updateUser($id: ID!, $input: UserInput!) {
    updateUser(id: $id, input: $input) {
      id
      ai_access
      color_mode
      email
      firstname
      group_name
      lastname
      loginAt
      login_type
      locale
      alert
      is_online
      phone
      position
      username
      user_ai {
        token_count
        token_all
        ai {
          model_name
          model_use_name
          model_type
        }
      }
      user_role {
        role {
          role_name
        }
      }
    }
  }
`;

export const DELETE_USER = gql`
  mutation deleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`;