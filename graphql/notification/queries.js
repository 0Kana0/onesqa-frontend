import { gql } from "@apollo/client";

export const MY_NOTIFICATIONS = gql`
  query myNotifications($locale: localeMode, $user_id: ID!, $first: Int, $after: String) {
    myNotifications(locale: $locale, user_id: $user_id, first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          message
          type
          createdAt
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;