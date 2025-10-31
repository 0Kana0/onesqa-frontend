import { gql } from "@apollo/client";

export const GET_AIS = gql`
  query ai {
    ais {
      id
      activity
      model_name
      model_use_name
      model_type
      token_count
      token_all
      today
      average
    }
  }
`;

