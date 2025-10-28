import { gql } from "@apollo/client";

export const CREATE_CHATGROUP = gql`
  mutation createChatgroup($input: ChatgroupInput!) {
    createChatgroup(input: $input) {
      id
      chatgroup_name
    }
  }
`;

export const UPDATE_CHATGROUP = gql`
  mutation updateChatgroup($id: ID!, $input: ChatgroupInput!) {
    updateChatgroup(id: $id, input: $input) {
      id
      chatgroup_name
    }
  }
`;

export const DELETE_CHATGROUP = gql`
  mutation deleteChatgroup($id: ID!) {
    deleteChatgroup(id: $id)
  }
`;