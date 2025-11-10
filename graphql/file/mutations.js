import { gql } from '@apollo/client';

export const MULTIPLE_UPLOAD = gql`
  mutation ($files: [Upload!]!) {
    multipleUpload(files: $files) {
      id
      filename
      original_name
      stored_path
    }
  }
`;