import { gql } from "@apollo/client";

export const DELETE_LOGS = gql`
  mutation deleteLogs {
    deleteLogs
  }
`;