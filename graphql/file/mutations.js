import { gql } from '@apollo/client';

export const MULTIPLE_UPLOAD = gql`
  mutation (
    $files: [Upload!]!, 
    $ai_id: ID!,
    $user_id: ID!
  ) {
    multipleUpload(
      files: $files, 
      ai_id: $ai_id, 
      user_id: $user_id
    ) {
      id
      filename
      original_name
      stored_path
    }
  }
`;