import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PaymentGateway = {
  id: string;
  provider: string | null;
  account_number: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

/** All payment gateways ordered for display. Pass true for active entries only. */
export function usePaymentGateways(activeOnly = false) {
  return useQuery({
    queryKey: ["payment-gateways", activeOnly],
    queryFn: async (): Promise<PaymentGateway[]> => {
      let query = supabase
        .from("payment_gateways")
        .select("id, provider, account_number, description, image_url, is_active, sort_order")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (activeOnly) query = query.eq("is_active", true);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as PaymentGateway[];
    },
  });
}

/** Human label for a gateway, tolerating empty provider names. */
export const gatewayLabel = (g: PaymentGateway) =>
  g.provider?.trim() || g.account_number?.trim() || "Payment account";
