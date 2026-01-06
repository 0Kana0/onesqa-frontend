import { gql } from "@apollo/client";

export const GET_PROMPTS = gql`
  query prompts($locale: localeMode) {
    prompts(locale: $locale) {
      id
      prompt_title
      prompt_detail
      locale
    }
  }
`;
