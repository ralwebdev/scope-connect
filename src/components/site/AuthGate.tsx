import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useIsLoggedIn } from "@/hooks/use-scope";
import { streak } from "@/lib/scope-store";

/** Wrap any page that requires auth — redirects guests to /auth. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthed = useIsLoggedIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isAuthed) {
      navigate({ to: "/auth" });
    } else {
      streak.tick();
    }
  }, [isAuthed, navigate]);

  if (!isAuthed) return null;
  return <>{children}</>;
}
