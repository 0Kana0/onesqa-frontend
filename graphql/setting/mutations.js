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
      setting_name_th
      setting_name_en
      setting_detail_th
      setting_detail_en
      activity
    }
  }
`;
