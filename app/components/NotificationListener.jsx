"use client";
import { createClient } from "graphql-ws";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { MY_NOTIFICATIONS } from "@/graphql/notification/queries";
import Badge from "@mui/material/Badge";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useTranslations } from "next-intl";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/context/LanguageContext";

export default function NotificationListener({
  user_id,
  isOnNotificationPage,
  hasNotification,
  setHasNotification,
}) {
  const { locale } = useLanguage();
  const t = useTranslations("Toast");
  const WS_ENDPOINT = process.env.NEXT_PUBLIC_WS_ENDPOINT;

  const alert = localStorage.getItem("alert");
  const router = useRouter();

  const {
    refetch,
  } = useQuery(MY_NOTIFICATIONS, {
    variables: {
      locale: locale,
      user_id: user_id,
      first: 4,
      after: null,
    },
    skip: !user_id,
    notifyOnNetworkStatusChange: true, // ให้รู้สถานะระหว่าง fetchMore/refetch
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    const client = createClient({
      url: WS_ENDPOINT,
    });

    // ✅ Subscribe ฟัง notificationAdded
    const unsubscribe = client.subscribe(
      {
        query: `
          subscription notificationAdded($user_id: ID!) {
            notificationAdded(user_id: $user_id) {
              id
              message
              title
              type
              locale
              user_id
              createdAt
            }
          }
        `,
        variables: { user_id },
      },
      {
        next: ({ data }) => {
          const n = data?.notificationAdded;
          if (n) {
            // console.log("📩 New notification:", n);
            // console.log(isOnNotificationPage);

            // ✅ มีข้อมูลใหม่เข้ามา → เปลี่ยนสถานะ
            // ใน subscription callback
            if (!isOnNotificationPage) {
              setHasNotification(true);
              localStorage.setItem("alert", true); // เก็บเป็นสตริงเสมอ
              // อย่าพึ่งอิง log ของ hasNotification ที่นี่ เพราะจะเป็นค่าเก่าจาก closure
            } else {
              refetch()
            }

            // ✅ แสดง Toast แจ้งเตือน
            toast.info(
              <div>
                <p>{t("title1")}</p>
              </div>,
              {
                //position: "bottom-right",
                autoClose: 4000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                //theme: "light",
                onClick: () => {
                  setHasNotification(false)
                  localStorage.removeItem("alert");
                  if (isOnNotificationPage) {
                    // ปิด toast ที่กำลังแสดงอยู่ทั้งหมดทันทีเมื่อเข้าหน้านี้
                    toast.dismiss();
                  } else {
                    router.push(`/onesqa/notification`); // 👈 หน้าเป้าหมาย
                  }
                },
              }
            );
          }
        },
        error: (err) => console.log("Subscription error:", err),
        complete: () => console.log("🔌 Subscription complete"),
      }
    );

    return () => unsubscribe(); // cleanup
  }, [user_id, WS_ENDPOINT, t, isOnNotificationPage, refetch]);

  return (
    <div>
      {hasNotification || alert ? (
        // ✅ ถ้ามี notification → แสดง Badge สีแดง
        <Badge
          variant="dot"
          overlap="circular"
          sx={{
            "& .MuiBadge-dot": {
              backgroundColor: "#E53935", // 🔴 สีแดง
              width: 10,
              height: 10,
              borderRadius: "50%",
              top: 4,
              right: 4,
            },
          }}
        >
          <NotificationsNoneIcon />
        </Badge>
      ) : (
        // ❌ ถ้าไม่มี notification → แสดงเฉพาะ icon
        <NotificationsNoneIcon />
      )}
    </div>
  );
}
