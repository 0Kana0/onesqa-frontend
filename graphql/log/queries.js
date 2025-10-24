import { gql } from "@apollo/client";

export const GET_LOGS = gql`
  query GET_LOGS($page: Int, $pageSize: Int, $where: LogFilterInput) {
    logs(page: $page, pageSize: $pageSize, where: $where) {
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
        createdAt
      }
    }
  }
`;
