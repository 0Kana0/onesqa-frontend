"use client";

import React, { useState, useEffect } from "react";
import { NetworkStatus } from "@apollo/client";
import { useQuery, useMutation, useApolloClient } from "@apollo/client/react";
import {
  Box,
  CircularProgress,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { GET_CHAT } from "@/graphql/chat/queries";
import { GET_MESSAGES } from "@/graphql/message/queries";
import { CREATE_MESSAGE } from "@/graphql/message/mutations";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';

const MessagePage = () => {
  const params = useParams();
  const { id } = params;

  const tInit = useTranslations("Init");
  
  const isMobile = useMediaQuery("(max-width:600px)"); // < md คือจอเล็ก
  const isTablet = useMediaQuery("(max-width:1200px)"); // < md คือจอเล็ก

  const {
    data: chatData,
    loading: chatLoading,
    error: chatError,
  } = useQuery(GET_CHAT, {
    fetchPolicy: "network-only",
    variables: {
      id: id,
    },
  });

  const {
    data: messagesData,
    loading: messagesLoading,
    error: messagesError,
  } = useQuery(GET_MESSAGES, {
    fetchPolicy: "network-only",
    variables: {
      chat_id: id,
    },
  });

  if (messagesLoading)
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <CircularProgress />
        <Typography>{tInit("loading")}...</Typography>
      </Box>
      );
      
  if (messagesError)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        ❌ {tInit("error")}
      </Typography>
    );

  console.log(messagesData?.messages);

  return (
    <div>
      MessagePage
    </div>
  )
}

export default MessagePage
