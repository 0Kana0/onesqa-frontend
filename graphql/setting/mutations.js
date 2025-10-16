import { gql } from "@apollo/client";

export const UPDATE_SETTING = gql`
  mutation updateSetting(
    $id: ID!
    $input: SettingInput!
  ) {
    updateSetting(
      id: $id
      input: $input
    ) {
      id
      setting_name
      setting_detail
      activity
    }
  }
`;
