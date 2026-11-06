import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api/endpoints";
import type { Me } from "./api/types";
import { keys, useMe } from "./data/queries";
import { Splash } from "./layout/Splash";
import { AppShell } from "./layout/AppShell";
import { CardDetail } from "./screens/CardDetail";
import { Cards } from "./screens/Cards";
import { Home } from "./screens/Home";
import { Login } from "./screens/Login";
import { Settings } from "./screens/Settings";
import { Subscriptions } from "./screens/Subscriptions";
import { UiProvider } from "./ui/UiContext";
import { Loading } from "./components/ScreenHeader";
import { looksSignedIn } from "./data/startup";
import { StartupSkeleton } from "./layout/StartupSkeleton";

// Insights (and its animated donut chart) is downloaded only when you open it,
// which keeps the first load of the app smaller.
const Insights = lazy(() => import("./screens/Insights").then((m) => ({ default: m.Insights })));

export function App() {
  const me = useMe();
  // The opening splash may leave once we know who you are and, if you're
  // signed in, Home's totals have arrived (they were requested alongside /me).
  const summary = useQuery({ queryKey: keys.summary, queryFn: api.summary, enabled: !!me.data });
  const ready = !me.isPending && (!me.data || !summary.isPending);

  return (
    <>
      <Screens me={me.data} pending={me.isPending} />
      <Splash ready={ready} />
    </>
  );
}

function Screens({ me, pending }: { me: Me | null | undefined; pending: boolean }) {

  // First load: we don't know yet whether the cookies hold a valid session.
  // If this browser looks signed in, show Home's outline right away instead
  // of a blank page (the real data is already loading, see data/startup.ts).
  if (pending) return looksSignedIn() ? <StartupSkeleton /> : <div className="h-full bg-bg" />;

  // No session (or it expired and refresh failed) → login screen.
  if (!me) return <Login />;

  return (
    <UiProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route
              path="insights"
              element={
                <Suspense fallback={<Loading />}>
                  <Insights />
                </Suspense>
              }
            />
            <Route path="cards" element={<Cards />} />
            <Route path="cards/:id" element={<CardDetail />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </UiProvider>
  );
}
