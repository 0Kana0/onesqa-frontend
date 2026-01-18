import { gql } from "@apollo/client";

export const CREATE_MESSAGE = gql`
  mutation createMessage($input: MessageInput!)  {
    createMessage(input: $input) {
      text
    }
  }
`;

export const CREATE_MESSAGE_IMAGE = gql`
  mutation createMessageImage($input: MessageInput!)  {
    createMessageImage(input: $input) {
      text
    }
  }
`;

export const CREATE_MESSAGE_VIDEO = gql`
  mutation createMessageVideo($input: MessageInput!)  {
    createMessageVideo(input: $input) {
      text
    }
  }
`;

export const CREATE_MESSAGE_DOC = gql`
  mutation createMessageDoc($input: MessageInput!)  {
    createMessageDoc(input: $input) {
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
