"use client";

import * as React from "react";
import { Box, Stack } from "@mui/material";
import ChatBubble from "./ChatBubble";

/**
 * ChatThread
 * @param {Array<{id:string|number, role:'user'|'assistant', text:string, time?:string|number|Date}>} messages
 * @param {boolean} dense - ระยะห่างแถวแชตเล็กลง
 */
export default function ChatThread({ messages = [], dense = false }) {
  return (
    <Box sx={{ width: "100%" }}>
      <Stack spacing={dense ? 1 : 2}>
        {messages.map((m) => (
          <ChatBubble
            key={m.id}
            role={m.role}
            text={m.text}
            time={m.createdAt}
          />
        ))}
      </Stack>
    </Box>
  );
}
