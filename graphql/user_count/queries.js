import { gql } from "@apollo/client";

export const USER_COUNT_REPORTS = gql`
  query cardUserCountReports {
    cardUserCountReports {
      value
      percentChange
    }
  }
`;

export const CHART_USER_COUNT_REPORTS = gql`
  query chartUserCountReports($startDate: DateTime, $endDate: DateTime) {
    chartUserCountReports(startDate: $startDate, endDate: $endDate) {
      date
      total_user
    }
  }
`;