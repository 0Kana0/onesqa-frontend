import { gql } from "@apollo/client";

export const CREATE_PROMPT = gql`
  mutation createPrompt($input: PromptInput!) {
    createPrompt(input: $input) {
      id
      prompt_title
      prompt_detail
      locale
    }
  }
`;

export const UPDATE_PROMPT = gql`
  mutation updatePrompt($id: ID!, $input: PromptInput!) {
    updatePrompt(id: $id, input: $input) {
      id
      prompt_title
      prompt_detail
      locale
    }
  }
`;

export const DELETE_PROMPT = gql`
  mutation deletePrompt($id: ID!) {
    deletePrompt(id: $id)
  }
`;