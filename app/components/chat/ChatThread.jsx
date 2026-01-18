"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import ChatBubble from "./ChatBubble";

/**
 * ChatThread
 * @param {Array<{id:string|number, role:'user'|'assistant', text:string, time?:string|number|Date}>} messages
 * @param {boolean} dense - ระยะห่างแถวแชตเล็กลง
 */
export default function ChatThread({ messages = [], dense = false, onChangeEdit = () => {}, chat = [], edit_status = true, sending = false }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={dense ? 1 : 2}>
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            id={m.id}
            role={m.role}
            message_type={m.message_type}
            text={m.text}
            files={m.files}
            time={m.createdAt}
            onChangeEdit={onChangeEdit}
            chat={chat}
            edit_status={edit_status}
            sending={sending}
          />
        ))}
      </Stack>
    </Box>
  );
}
