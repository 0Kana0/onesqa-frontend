"use client";

import React from "react";
import { useQuery, useApolloClient } from "@apollo/client/react";
import { GET_AI_BACKUPS } from "@/graphql/ai_backup/queries";

const BackupPage = () => {
  const client = useApolloClient();

  const {
    data: aisData,
    loading: aisLoading,
    error: aisError,
  } = useQuery(GET_AI_BACKUPS, {
    fetchPolicy: "network-only",
  });

  if (aisLoading) return <div>Loading...</div>;
  if (aisError) return <div>Error: {aisError.message}</div>;

  return (
    <div>
      <h2>จำนวน Token คงเหลือ</h2>

      {aisData?.ai_backups?.map((item) => (
        <div
          key={item.id}
          style={{
            paddingLeft: "10px",
            paddingRight: "10px",
          }}
        >
          <p>
            <b>Model Name:</b> {item.model_use_name}
          </p>
          <p>
            <b>Token Count:</b> {item.token_count}
          </p>
          <hr />
        </div>
      ))}
    </div>
  );
};

export default BackupPage;
