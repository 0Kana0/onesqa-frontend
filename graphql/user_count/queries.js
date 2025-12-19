import { gql } from "@apollo/client";

export const USER_COUNT_REPORTS = gql`
  query cardUserCountReports {
    cardUserCountReports {
      value
      percentChange
    }
  }
`;
