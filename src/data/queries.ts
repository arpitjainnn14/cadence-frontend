// Server state lives in TanStack Query: it fetches, caches, and refetches
// after mutations. Screens call these hooks instead of fetching directly.
import { QueryCache, QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthError } from "../api/client";
import { api } from "../api/endpoints";
import type { PaymentMethod, Period, Subscription, SubscriptionIn } from "../api/types";
import { paymentLabels } from "../lib/cardStyle";
import { signOut } from "./signOut";

export const keys = {
  me: ["me"] as const,
  paymentMethods: ["payment-methods"] as const,
  subscriptions: ["subscriptions"] as const,
  summary: ["summary"] as const,
  insights: (p: Period) => ["insights", p] as const,
  settings: ["settings"] as const,
};

export function makeQueryClient() {
  const client: QueryClient = new QueryClient({
    // If any request finds the session is gone, flip the app to the login screen.
    queryCache: new QueryCache({
      onError: (error) => {
        if (error instanceof AuthError) client.setQueryData(keys.me, null);
      },
    }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) => !(error instanceof AuthError) && count < 2,
        refetchOnWindowFocus: true,
      },
      mutations: {
        onError: (error) => {
          if (error instanceof AuthError) client.setQueryData(keys.me, null);
        },
      },
    },
  });
  return client;
}

// ---------- reads ----------

/** `null` means "not signed in". */
export const useMe = () =>
  useQuery({
    queryKey: keys.me,
    queryFn: async () => {
      try {
        return await api.me();
      } catch (e) {
        if (e instanceof AuthError) return null;
        throw e;
      }
    },
    staleTime: Infinity,
  });

export const usePaymentMethods = () => useQuery({ queryKey: keys.paymentMethods, queryFn: () => api.paymentMethods() });
export const useSubscriptions = () => useQuery({ queryKey: keys.subscriptions, queryFn: api.subscriptions });
export const useSummary = () => useQuery({ queryKey: keys.summary, queryFn: api.summary });
export const useInsights = (period: Period) =>
  useQuery({ queryKey: keys.insights(period), queryFn: () => api.insights(period) });
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: api.settings });

/** Lookup helper: payment method by id. */
export function usePaymentMethodMap(): Map<string, PaymentMethod> {
  const { data } = usePaymentMethods();
  return new Map((data ?? []).map((p) => [p.id, p]));
}

/** id → name to display, with the network added when two cards share a name. */
export function usePaymentLabels(): Map<string, string> {
  const { data } = usePaymentMethods();
  return paymentLabels(data ?? []);
}

// ---------- writes ----------

/** Anything that changes money totals refreshes every derived view. */
function useRefreshAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.subscriptions }),
      qc.invalidateQueries({ queryKey: keys.summary }),
      qc.invalidateQueries({ queryKey: ["insights"] }),
      qc.invalidateQueries({ queryKey: keys.paymentMethods }),
    ]);
}

export function useSaveSubscription() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: ({ id, body }: { id?: string; body: SubscriptionIn }) =>
      id ? api.updateSubscription(id, body) : api.createSubscription(body),
    onSuccess: refresh,
  });
}

export function useDeleteSubscription() {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: (s: Subscription) => api.deleteSubscription(s.id), onSuccess: refresh });
}

export function useAddCard() {
  const refresh = useRefreshAll();
  return useMutation({ mutationFn: (form: FormData) => api.addPaymentMethod(form), onSuccess: refresh });
}

export function useUpdateCard() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Parameters<typeof api.updatePaymentMethod>[1] }) =>
      api.updatePaymentMethod(id, patch),
    onSuccess: refresh,
  });
}

export function useSetCardImage() {
  const refresh = useRefreshAll();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.setPaymentMethodImage(id, file),
    onSuccess: refresh,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => api.login(email, password),
    onSuccess: (me) => qc.setQueryData(keys.me, me),
  });
}

/** Returns a function that signs out immediately (see signOut.ts). */
export function useLogout(): () => void {
  const qc = useQueryClient();
  return () => signOut(qc, api.logout);
}

/** Set (or clear, with null) the monthly ₹ budget. Home's budget meter comes from the summary, so refresh it too. */
export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (monthly_budget_inr: string | null) => api.updateSettings({ monthly_budget_inr }),
    onSuccess: (data) => {
      qc.setQueryData(keys.settings, data);
      return qc.invalidateQueries({ queryKey: keys.summary });
    },
  });
}

/** Change password. On success the backend sets new cookies here (we stay signed in) and signs out other devices. */
export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) => api.changePassword(current, next),
  });
}
