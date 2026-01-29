import { Suspense } from "react";
import AfterLoginClient from "./AfterLoginClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AfterLoginClient />
    </Suspense>
  );
}
