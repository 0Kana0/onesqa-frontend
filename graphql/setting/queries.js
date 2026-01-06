import { gql } from "@apollo/client";

export const GET_SETTINGS = gql`
  query settings {
    settings {
      id
      setting_name_th
      setting_name_en
      activity
      setting_detail_th
      setting_detail_en
    }
  }
`;
