import { Navigate, useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { LS_TOKEN_KEY, tokenAtom } from "@/atoms/auth";

function AuthLayout({ children }: { children: React.ReactNode }) {
  const atomToken = useAtomValue(tokenAtom);
  const search = useSearch({ from: "/login" }) as { redirect?: string };
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
    const to = search?.redirect ? decodeURIComponent(search.redirect) : "/";
    return <Navigate to={to} />;
  }

  return children;
}

export default AuthLayout;
