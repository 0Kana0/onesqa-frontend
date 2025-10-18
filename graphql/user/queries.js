import { gql } from "@apollo/client";

export const GET_USERS = gql`
  query users {
    users {
      id
      firstname
      lastname
      position
      ai_access
      loginAt
      email
      phone
      group_name
      user_ai {
        activity
        token_count
        token_all
        ai {
          model_name
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

export const GET_USER = gql`
  query user ($id: ID!) {
    user (id: $id) {
      id
      ai_access
      color_mode
      email
      firstname
      group_name
      lastname
      loginAt
      login_type
      phone
      position
      username
      user_ai {
        ai_id
        activity
        token_count
        token_all
        today
        average
        ai {
          model_name
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