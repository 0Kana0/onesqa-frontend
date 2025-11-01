import { gql } from "@apollo/client";

export const GET_REPORTS = gql`
  query reports($page: Int, $pageSize: Int, $where: ReportFilterInput) {
    reports(page: $page, pageSize: $pageSize, where: $where) {
      items {
        id
        date
        position
        tokens
        user
        user_id
        chats
      }
      page
      pageSize
      totalCount
    }
  }
`;

export const MESSAGE_REPORTS = gql`
  query cardMessageReports {
    cardMessageReports {
      value
      percentChange
    }
  }
`;

export const TOKEN_REPORTS = gql`
  query cardTokenReports {
    cardTokenReports {
      value
      percentChange
    }
  }
`;

export const CHART_REPORTS = gql`
  query chartReports($startDate: DateTime, $endDate: DateTime) {
    chartReports(startDate: $startDate, endDate: $endDate) {
      date
      model
      total_tokens
    }
  }
`;

export const TOPFIVE_REPORTS = gql`
  query topFiveReports {
    topFiveReports {
      rank
      tokens
      name
      color
      chats
    }
  }
`;
