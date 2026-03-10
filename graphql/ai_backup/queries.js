import { gql } from "@apollo/client";

export const GET_AI_BACKUPS = gql`
  query ai_backups {
    ai_backups {
      id
      activity
      model_name
      model_use_name
      model_type
      message_type
      token_count
      token_all
    }
  }
`;
