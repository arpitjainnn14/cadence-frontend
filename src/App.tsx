import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { useMe } from "./data/queries";
import { AppShell } from "./layout/AppShell";
import { CardDetail } from "./screens/CardDetail";
import { Cards } from "./screens/Cards";
import { Home } from "./screens/Home";
import { Insights } from "./screens/Insights";
import { Login } from "./screens/Login";
import { Settings } from "./screens/Settings";
import { Subscriptions } from "./screens/Subscriptions";
import { UiProvider } from "./ui/UiContext";

export function App() {
  const me = useMe();

  // First load: we don't know yet whether the cookies hold a valid session.
  if (me.isPending) return <div className="h-full bg-bg" />;

  // No session (or it expired and refresh failed) → login screen.
  if (!me.data) return <Login />;

  return (
    <UiProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Home />} />
            <Route path="subscriptions" element={<Subscriptions />} />
            <Route path="insights" element={<Insights />} />
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
