import { gql } from "@apollo/client";

export const GET_SAR_HISTORY = gql`
  query sarHistory($page: Int, $pageSize: Int, $where: SarHistoryFilterInput) {
    sarHistory(page: $page, pageSize: $pageSize, where: $where) {
      page
      pageSize
      totalCount
      items {
        id
        delete_name
        sar_file
        createdAt
        academy {
          id
          name
          code
        }
      }
    }
  }
`;
