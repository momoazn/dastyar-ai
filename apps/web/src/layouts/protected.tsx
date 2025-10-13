import { Navigate } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { tokenAtom } from "@/atoms/auth";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAtomValue(tokenAtom);

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
