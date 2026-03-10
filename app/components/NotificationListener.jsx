"use client";
import { createClient } from "graphql-ws";
import { useEffect, useRef } from "react";
import { useQuery } from "@apollo/client/react";
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
  const router = useRouter();

  const toastIdRef = useRef("notification-toast"); // ✅ ใช้ id เดิมตลอด

  const { refetch } = useQuery(MY_NOTIFICATIONS, {
    variables: { locale, user_id, first: 4, after: null },
    skip: !user_id,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "network-only",
  });

  useEffect(() => {
    if (!user_id || !WS_ENDPOINT) return;

    const wsClient = createClient({ url: WS_ENDPOINT });

    const unsubscribe = wsClient.subscribe(
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
          if (!n) return;

          if (!isOnNotificationPage) {
            setHasNotification(true);
            localStorage.setItem("alert", "true");
          } else {
            refetch();
          }

          const content = (
            <div>
              <p>{t("title1")}</p>
            </div>
          );

          const commonOptions = {
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            onClick: () => {
              setHasNotification(false);
              localStorage.removeItem("alert");

              // ✅ ปิด toast อันนี้โดยเฉพาะ
              toast.dismiss(toastIdRef.current);

              if (!isOnNotificationPage) {
                router.push(`/onesqa/notification`);
              }
            },
          };

          // ✅ ถ้ามี toast นี้อยู่แล้ว -> อัปเดตแทน (ไม่ซ้อน)
          if (toast.isActive(toastIdRef.current)) {
            toast.update(toastIdRef.current, {
              render: content,
              type: "info",
              ...commonOptions,
            });
          } else {
            toast.info(content, {
              toastId: toastIdRef.current,
              ...commonOptions,
            });
          }
        },
        error: (err) => console.log("Subscription error:", err),
        complete: () => console.log("🔌 Subscription complete"),
      }
    );

    return () => unsubscribe();
  }, [user_id, WS_ENDPOINT, t, isOnNotificationPage, refetch, router, setHasNotification]);

  const alert = typeof window !== "undefined" ? localStorage.getItem("alert") : null;

  return (
    <div>
      {hasNotification || alert ? (
        <Badge
          variant="dot"
          overlap="circular"
          sx={{
            "& .MuiBadge-dot": {
              backgroundColor: "#E53935",
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
        <NotificationsNoneIcon />
      )}
    </div>
  );
}
