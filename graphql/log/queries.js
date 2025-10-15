import { gql } from "@apollo/client";

export const GET_LOGS = gql`
  query logs {
    logs {
      id
      edit_name
      log_type
      old_data
      new_data
      old_status
      new_status
      createdAt
    }
  }
`;
