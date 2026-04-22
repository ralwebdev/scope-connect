import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useIsLoggedIn } from "@/hooks/use-scope";
import { streak, notifications } from "@/lib/scope-store";

/** Wrap any page that requires auth — redirects guests to /auth.
 *  Defers all auth-driven rendering until after client mount to avoid SSR/CSR mismatch. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const isAuthed = useIsLoggedIn();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthed) {
      navigate({ to: "/auth" });
    } else {
      streak.tick();
      notifications.ensureSeeded();
    }
  }, [isAuthed, navigate, mounted]);

  if (!mounted || !isAuthed) return null;
  return <>{children}</>;
}
