import { gql } from "@apollo/client";

export const GET_REPORTS = gql`
  query reports($page: Int, $pageSize: Int, $where: ReportFilterInput) {
    reports(page: $page, pageSize: $pageSize, where: $where) {
      items {
        id
        date
        group
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

export const GET_PERIOD_REPORTS = gql`
  query periodReports($page: Int, $pageSize: Int, $period: PeriodInput!, $search: String) {
    periodReports(page: $page, pageSize: $pageSize, period: $period, search: $search) {
      items {
        id
        user_id
        user
        group
        period
        period_start
        chats
        tokens
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

export const PERIOD_CHART_REPORTS = gql`
  query periodChartReports($period: PeriodInput!) {
    periodChartReports(period: $period) {
      ts
      model_type
      value
    }
  }
`;

export const TOPFIVE_REPORTS = gql`
  query topFiveReports($month: Int, $year: Int)  {
    topFiveReports(month: $month, year: $year) {
      rank
      tokens
      name
      color
      chats
    }
  }
`;
