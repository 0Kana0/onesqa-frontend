import { gql } from "@apollo/client";

export const GET_SETTINGS = gql`
  query settings {
    settings {
      id
      setting_name
      activity
      setting_detail
    }
  }
`;
