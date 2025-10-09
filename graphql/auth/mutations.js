import { gql } from "@apollo/client";

export const SIGNIN = gql`
  mutation signin($input: SigninInput!) {
    signin(input: $input) {
      user {
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
      token
    }
  }
`;

export const SIGNIN_WITH_ID = gql`
  mutation signinWithIdennumber($input: SigninWithIdInput!) {
    signinWithIdennumber(input: $input) {
      message
    }
  }
`;

export const VERIFY_SIGNIN_WITH_ID = gql`
  mutation verifySigninWithIdennumber($input: VerifySigninWithIdInput!) {
    verifySigninWithIdennumber(input: $input) {
      token
      user {
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
  }
`;

export const REFRESH_TOKEN = gql`
  mutation refreshToken {
    refreshToken {
      user {
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
      token
    }
  }
`;

export const LOGOUT = gql`
  mutation logout {
    logout {
      message
    }
  }
`;