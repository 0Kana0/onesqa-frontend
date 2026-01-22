import { gql } from "@apollo/client";

export const SYNC_ACADEMY = gql`
  mutation syncAcademyFromApi {
    syncAcademyFromApi {
      message
      status
    }
  }
`;

export const REMOVE_SAR_FILES = gql`
  mutation RemoveSarFiles($academy_id: ID!, $files: [String!]!) {
    removeSarFiles(academy_id: $academy_id, files: $files) {
      ok
      removedCount
    }
  }
`;