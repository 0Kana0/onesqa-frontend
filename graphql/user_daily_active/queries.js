import { gql } from "@apollo/client";

export const PERIOD_USERS_ACTIVE = gql`
  query periodUsersActive($period: PeriodInput!) {
    periodUsersActive(period: $period) {
      ts
      model_type
      value
    }
  }
`;
