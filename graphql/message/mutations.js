import { gql } from "@apollo/client";

export const CREATE_MESSAGE = gql`
  mutation createMessage($input: MessageInput!)  {
    createMessage(input: $input) {
      text
    }
  }
`;
