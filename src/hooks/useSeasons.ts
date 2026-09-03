import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Season = Database["public"]["Tables"]["seasons"]["Row"];

export function useSeasons() {
  return useQuery({
    queryKey: ["seasons"],
    queryFn: async (): Promise<Season[]> => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveSeason() {
  return useQuery({
    queryKey: ["active-season"],
    queryFn: async (): Promise<Season | null> => {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type Countdown = { days: number; hours: number; minutes: number; seconds: number; ended: boolean };

/** Live ticking countdown to an ISO date/date-only string. */
export function useCountdown(target: string | null | undefined): Countdown {
  const compute = (): Countdown => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    // Date-only values end at the close of that day.
    const iso = target.length === 10 ? `${target}T23:59:59` : target;
    const diff = new Date(iso).getTime() - Date.now();
    if (!Number.isFinite(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
    return {
      days: Math.floor(diff / 86_400_000),
      hours: Math.floor((diff % 86_400_000) / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
      ended: false,
    };
  };

  const [value, setValue] = useState<Countdown>(compute);

  useEffect(() => {
    setValue(compute());
    const timer = setInterval(() => setValue(compute()), 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

/** Id of the currently active season, for tagging new records. */
export async function fetchActiveSeasonId(): Promise<string | null> {
  const { data } = await supabase.from("seasons").select("id").eq("is_active", true).maybeSingle();
  return data?.id ?? null;
}
