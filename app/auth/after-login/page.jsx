import dynamic from "next/dynamic";

const AfterLoginClient = dynamic(() => import("./AfterLoginClient"), { ssr: false });

export default function Page() {
  return <AfterLoginClient />;
}