import { Navigate, useSearch } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/atoms/auth";

function AuthLayout({ children }: { children: React.ReactNode }) {
  const token = useAtomValue(tokenAtom);

  // Use useSearch to get redirect param more directly
  const search = useSearch({ strict: false }) as { redirect?: string };

  if (token) {
    const redirect = search.redirect;
    const to = redirect ? decodeURIComponent(redirect) : "/";
    return <Navigate to={to} />;
  }

  return children;
}

export default AuthLayout;
