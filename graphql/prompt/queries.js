import { gql } from "@apollo/client";

export const GET_PROMPTS = gql`
  query prompts {
    prompts {
      id
      prompt_title
      prompt_detail
      locale
    }
  }
`;
