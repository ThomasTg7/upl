import type { ReactNode } from "react";

/** Templates remount on navigation, so this CSS entry needs no client bundle. */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="upl-page-enter">{children}</div>;
}
