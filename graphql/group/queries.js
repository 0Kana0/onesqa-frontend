import { gql } from "@apollo/client";

export const GET_GROUPS = gql`
  query groups($page: Int, $pageSize: Int, $where: GroupFilterInput) {
    groups(page: $page, pageSize: $pageSize, where: $where) {
      page
      pageSize
      totalCount
      items {
        id
        name
        status

        ai {
          model_use_name
        }

        group_ai {
          init_token
          ai {
            model_use_name
          }
        }

        user_count

        # ✅ เพิ่มตรงนี้: today/average แยกตาม Model
        models {
          ai_id
          average
          today
          ai {
            model_use_name
          }
          token_count
          token_all
        }
      }
    }
  }
`;

export const GET_GROUP = gql`
  query group($id: ID!) {
    group(id: $id) {
      id
      name
      status
      ai {
        model_use_name
      }
      group_ai {
        init_token
        ai {
          model_use_name
        }
      }
    }
  }
`;

export const GET_GROUP_BY_NAME = gql`
  query groupByName($name: String!) {
    groupByName(name: $name) {
      id
      name
      status
      ai {
        model_use_name
      }
      group_ai {
        init_token
        ai {
          model_use_name
        }
      }
    }
  }
`;

export const GET_GROUP_WITH_USER_COUNT = gql`
  query groupWithUserCount {
    groupWithUserCount {
      name
      user_count
    }
  }
`;