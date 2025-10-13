import { Navigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/atoms/auth";

function AuthLayout({ children }: { children: React.ReactNode }) {
  const token = useAtomValue(tokenAtom);

  if (token) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default AuthLayout;
