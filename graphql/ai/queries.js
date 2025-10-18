import { gql } from "@apollo/client";

export const GET_AIS = gql`
  query ai {
    ais {
      id
      activity
      model_name
      token_count
      token_all
      today
      average
    }
  }
`;

