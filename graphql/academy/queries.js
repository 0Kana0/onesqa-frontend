import { gql } from "@apollo/client";

export const COUNT_ACADEMY = gql`
  query countByAcademyLevel {
    countByAcademyLevel {
      academy_level_id
      count
    }
  }
`;

export const GET_ACADEMY_BY_CODE = gql`
  query academyByCode($code: String) {
    academyByCode(code: $code) {
      id
      academy_api_id
      name
      code
      academy_level_id
      sar_file
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACADEMY_BY_CODE_CHAT = gql`
  query academyByCodeChat($code: String) {
    academyByCodeChat(code: $code) {
      name
      sar_file
    }
  }
`;