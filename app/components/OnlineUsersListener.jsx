"use client";
import { createClient } from "graphql-ws";
import { useMutation, useQuery } from "@apollo/client/react";
import { useEffect, useState } from "react";

export default function OnlineUsersListener({online, refetch}) {
  const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT;
  console.log(online);

  useEffect(() => {
    const client = createClient({
      url: WS_ENDPOINT,
      lazy: false,
      retryAttempts: Infinity,
    });

    // ✅ subscribe แบบถูกต้อง ต้องใส่ next, error, complete ครบ
    const dispose = client.subscribe(
      {
        query: `
          subscription {
            userStatusChanged {
              user_id
              username
              is_online
            }
          }
        `,
      },
      {
        next: ({ data }) => {
          refetch()
          console.log("login check", data);
          
          const u = data?.userStatusChanged;
          if (!u) return;

        },
        error: (err) => console.error("❌ Subscription error:", err),
        complete: () => console.log("🔌 Subscription complete ✅"), // <== ต้องมี
      }
    );

    return () => dispose(); // cleanup
  }, [WS_ENDPOINT, refetch]);

  return (
    <div>
      <h3>🟢 ผู้ใช้งานออนไลน์ ({online.length})</h3>
    </div>
  );
}
