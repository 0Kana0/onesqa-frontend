import { gql } from "@apollo/client";

export const UPDATE_AI = gql`
  mutation updateAi(
    $id: ID!
    $input: AiInput!
  ) {
    updateAi(
      id: $id
      input: $input
    ) {
      id
      activity
      model_name
      token_count
      token_all
    }
  }
`;
