import { gql } from "@apollo/client";

export const GET_LOGS = gql`
  query logs($locale: localeMode, $page: Int, $pageSize: Int, $where: LogFilterInput) {
    logs(locale: $locale, page: $page, pageSize: $pageSize, where: $where) {
      page
      pageSize
      totalCount
      items {
        id
        edit_name
        log_type
        old_data
        new_data
        old_status
        new_status
        locale
        createdAt
      }
    }
  }
`;
