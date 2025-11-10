import { gql } from "@apollo/client";

export const CREATE_MESSAGE = gql`
  mutation createMessage($input: MessageInput!)  {
    createMessage(input: $input) {
      text
    }
  }
`;

export const UPDATE_MESSAGE = gql`
  mutation updateMessage($id: ID!, $input: MessageInput!)  {
    updateMessage(id: $id, input: $input) {
      text
    }
  }
`;
