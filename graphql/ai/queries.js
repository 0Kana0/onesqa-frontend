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
