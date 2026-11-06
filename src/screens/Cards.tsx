import { useNavigate } from "react-router";
import type { PaymentMethod } from "../api/types";
import { CardArt } from "../components/CardArt";
import { PlusIcon } from "../components/Icons";
import { LoadError, Loading, ScreenHeader, SectionTitle } from "../components/ScreenHeader";
import { usePaymentLabels, usePaymentMethods, useSubscriptions } from "../data/queries";
import { cardLook } from "../lib/cardStyle";
import { dualText, usageOf } from "../lib/money";
import { plural } from "../lib/format";
import { useUi } from "../ui/UiContext";
import { useIsDesktop } from "../ui/useIsDesktop";
import { useWidth } from "../ui/useWidth";

export function Cards() {
  const pms = usePaymentMethods();
  const labels = usePaymentLabels();
  const subs = useSubscriptions();
  const { openAddCard } = useUi();
  const navigate = useNavigate();
  const desk = useIsDesktop();
  const [stackRef, stackWidth] = useWidth<HTMLDivElement>();

  const cards = (pms.data ?? []).filter((p) => p.type !== "upi");
  const upis = (pms.data ?? []).filter((p) => p.type === "upi");
  const all = subs.data ?? [];

  const header = (
    <ScreenHeader
      eyebrow={pms.data ? `${plural(cards.length, "card", "cards")} · ${plural(upis.length, "UPI app", "UPI apps")}` : " "}
      title="Cards"
      right={
        <button
          type="button"
          onClick={openAddCard}
          className="flex h-[34px] flex-none items-center gap-1.5 rounded-[17px] border-none bg-s2 px-[13px] text-[13px] font-medium text-fg"
        >
          <PlusIcon size={13} weight={2.6} />
          Add card
        </button>
      }
    />
  );
  if (pms.isError) return <div className="flex flex-col gap-[22px]">{header}<LoadError onRetry={() => pms.refetch()} /></div>;
  if (!pms.data) return <div className="flex flex-col gap-[22px]">{header}<Loading /></div>;

  // On phones the cards stack like a wallet: each one covers the previous,
  // leaving a strip visible for the bank name + badge. The design uses 62px on
  // a 350px-wide card; the card text scales with width, so the strip does too.
  // Phones show the design's overlapping wallet stack, but only when every card
  // is drawn: real art is transparent and some of it is portrait, so it can't
  // cover the card behind it. With any real art we use a two-column grid with
  // square slots, where portrait and landscape cards come out a similar size.
  const stack = !desk && !cards.some((p) => p.has_image);
  const cardHeight = stackWidth / 1.586;
  const strip = (62 * stackWidth) / 350;
  const overlap = Math.max(0, Math.round(cardHeight - strip));
  const open = (p: PaymentMethod) => navigate(`/cards/${p.id}`);

  return (
    <div className="flex animate-screen-in flex-col gap-[22px]">
      {header}
      {cards.length === 0 ? (
        <div className="rounded-[18px] border border-dashed border-hair2 px-4 py-9 text-center text-sm text-fg2">
          No cards yet. Add the ones you pay subscriptions with.
        </div>
      ) : (
        <div
          ref={stackRef}
          className={stack ? "flex flex-col" : desk ? "grid gap-[22px]" : "grid grid-cols-2 gap-x-3.5 gap-y-5"}
          style={desk ? { gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" } : undefined}
        >
          {cards.map((p, i) => {
            const u = usageOf(p.id, all);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => open(p)}
                aria-label={labels.get(p.id) ?? p.display_name}
                className="relative block w-full border-none bg-transparent p-0 transition-transform duration-450 hover:-translate-y-2.5 active:scale-[0.98]"
                style={{ marginTop: stack && i ? -overlap : 0, transitionTimingFunction: "cubic-bezier(.3,1.3,.4,1)" }}
              >
                <CardArt look={cardLook(p)} badge={u.count ? `${dualText(u.monthly)}/mo` : undefined} slot={stack || desk ? undefined : 1.25} />
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <SectionTitle>UPI AutoPay</SectionTitle>
        <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          {upis.map((p) => {
            const look = cardLook(p);
            const u = usageOf(p.id, all);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => open(p)}
                className="flex items-center gap-3 rounded-2xl border-none bg-s1 p-3 text-left text-inherit shadow-lift"
              >
                <div
                  className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] text-sm font-bold tracking-[-0.02em]"
                  style={{ background: look.tile, color: look.tileFg }}
                >
                  {look.mark}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{p.display_name}</span>
                  <span className="text-xs whitespace-nowrap text-fg3">
                    {u.count ? `${dualText(u.monthly)}/mo · ${u.count}` : "Not used"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
