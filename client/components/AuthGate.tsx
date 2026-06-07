"use client";

import { useAppContext } from "@/context/AppContext";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading, isLoggedIn } = useAppContext();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}