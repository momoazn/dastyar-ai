import { Navigate, useRouterState } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { LS_TOKEN_KEY, tokenAtom } from "@/atoms/auth";

function AuthLayout({ children }: { children: React.ReactNode }) {
  const atomToken = useAtomValue(tokenAtom);
  const href = useRouterState({
    select: (s) => s.location.href,
  });
  const storedToken =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem(LS_TOKEN_KEY) || "null")
      : null;
  const token = atomToken ?? storedToken;
  const isHydrating = atomToken === null && !!storedToken;

  if (isHydrating) {
    return null;
  }

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
