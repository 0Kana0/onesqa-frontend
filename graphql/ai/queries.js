import { gql } from "@apollo/client";

export const GET_AIS = gql`
  query ais(
      $message_type: MessageType
    ) {
    ais(
      message_type: $message_type
    ) {
      id
      activity
      model_name
      model_use_name
      model_type
      message_type
      token_count
      token_all
      today
      average
    }
  }
`;

export const GET_SUM_TOKEN_BY_MODEL = gql`
  query sumTokenCountByModel {
    sumTokenCountByModel {
      ai_id
      model_name
      model_use_name
      model_type
      message_type
      ai_token_count
      total_token_count
      total_token_all
      user_count
      diff_token_count
    }
  }
`;