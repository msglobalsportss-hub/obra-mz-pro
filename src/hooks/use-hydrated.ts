import { useEffect, useState } from "react";
import { useObraMZStore } from "@/store/obramz-store";

/** Devolve true após o store persistido ter sido rehidratado no cliente. */
export function useHydrated(): boolean {
  const hydrated = useObraMZStore((s) => s._hydrated);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && hydrated;
}
