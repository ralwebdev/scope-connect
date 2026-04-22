import { useSyncExternalStore } from "react";
import { subscribe, auth, xp, streak, notifications, profileStrength, type ScopeUser } from "@/lib/scope-store";

function useStore<T>(getSnap: () => T): T {
  return useSyncExternalStore(subscribe, getSnap, getSnap);
}

export function useUser(): ScopeUser | null {
  return useStore(() => auth.getUser());
}
export function useIsLoggedIn(): boolean {
  return useStore(() => auth.isLoggedIn());
}
export function useXP(): number {
  return useStore(() => xp.get());
}
export function useLevel() {
  return useStore(() => xp.level());
}
export function useLevelProgress(): number {
  return useStore(() => xp.levelProgress());
}
export function useStreak(): number {
  return useStore(() => streak.count());
}
export function useUnreadNotifications(): number {
  return useStore(() => notifications.unread());
}
export function useNotifications() {
  return useStore(() => notifications.all());
}
export function useProfileStrength(): number {
  return useStore(() => profileStrength(auth.getUser()));
}

export function useStoreValue<T>(getter: () => T): T {
  return useStore(getter);
}
