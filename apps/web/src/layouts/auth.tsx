import { Navigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/atoms/auth";

function AuthLayout({ children }: { children: React.ReactNode }) {
  const token = useAtomValue(tokenAtom);
  const href = useRouterState({
    select: (s) => s.location.href,
  });

  if (token) {
    let redirect: string | null = null;
    try {
      const url = new URL(
        href,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost"
      );
      redirect = url.searchParams.get("redirect");
    } catch {
      redirect = null;
    }
    const to = redirect ? decodeURIComponent(redirect) : "/";
    return <Navigate to={to} />;
  }

  return children;
}

export default AuthLayout;
