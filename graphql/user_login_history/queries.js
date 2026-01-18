import { gql } from "@apollo/client";

export const GET_USER_LOGIN_HISTORY = gql`
  query loginHistory($page: Int, $pageSize: Int, $where: UserLoginHistoryFilterInput) {
    loginHistory(page: $page, pageSize: $pageSize, where: $where) {
      page
      pageSize
      totalCount
      items {
        id
        event_type
        user_agent
        createdAt
        user {
          id
          firstname
          lastname
          username
          group_name
          user_role {
            role {
              role_name_th
              role_name_en
            }
          }
        }
      }
    }
  }
`;
