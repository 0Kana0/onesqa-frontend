import { gql } from "@apollo/client";

export const CREATE_CHAT = gql`
  mutation createChat($input: ChatInput!) {
    createChat(input: $input) {
      id
      chat_name
    }
  }
`;

export const UPDATE_CHAT = gql`
  mutation updateChat($id: ID!, $input: ChatInput!) {
    updateChat(id: $id, input: $input) {
      id
      chat_name
    }
  }
`;

export const DELETE_CHAT = gql`
  mutation deleteChat($id: ID!) {
    deleteChat(id: $id)
  }
`;