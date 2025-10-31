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
      model_use_name
      model_type
      token_count
      token_all
    }
  }
`;
