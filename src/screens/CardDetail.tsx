import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/endpoints";
import { Link, useNavigate, useParams } from "react-router";
import { CardArt } from "../components/CardArt";
import { ChevronLeft } from "../components/Icons";
import { Loading, SectionTitle } from "../components/ScreenHeader";
import { RowGroup, SubRow } from "../components/SubRow";
import { subscriptionRow } from "../components/rowProps";
import { usePaymentLabels, usePaymentMethods, useSubscriptions, useUpdateCard } from "../data/queries";
import { cardLook } from "../lib/cardStyle";
import { toNum } from "../lib/format";
import { monthlyTotals, scaleDual } from "../lib/money";
import { DualAmount } from "../components/DualAmount";
import { useUi } from "../ui/UiContext";

const STATUS_ORDER = { active: 0, paused: 1, cancelled: 2 } as const;

export function CardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const pms = usePaymentMethods();
  const labels = usePaymentLabels();
  const subs = useSubscriptions();
  const update = useUpdateCard();
  const { openSubscription, toast } = useUi();
  const queryClient = useQueryClient();

  const back = (
    <Link
      to="/cards"
      className="flex h-8 items-center gap-0.5 self-start rounded-2xl bg-s2 pr-3 pl-1.5 text-[13px] font-medium text-fg no-underline"
    >
      <ChevronLeft size={17} />
      Cards
    </Link>
  );

  if (!pms.data || !subs.data) return <div className="flex flex-col gap-[22px]">{back}<Loading /></div>;
  const pm = pms.data.find((p) => p.id === id);
  if (!pm) {
    return (
      <div className="flex flex-col gap-[22px]">
        {back}
        <p className="text-fg2">This card isn't available any more.</p>
      </div>
    );
  }

  const rows = subs.data
    .filter((s) => s.payment_method_id === pm.id)
    // Active first; within a status, ₹ subscriptions by cost, then $ ones (never compared across currencies).
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        (a.currency !== b.currency ? (a.currency === "INR" ? -1 : 1) : toNum(b.yearly_amount) - toNum(a.yearly_amount)),
    );
  const monthly = monthlyTotals(rows);
  const activeCount = rows.filter((s) => s.status === "active").length;

  function deactivate() {
    update.mutate(
      { id: pm!.id, patch: { is_active: false } },
      {
        onSuccess: () => {
          navigate("/cards");
          // We've left this screen by the time Undo is tapped, so call the API directly.
          toast(`${pm!.display_name} hidden`, () => {
            api.updatePaymentMethod(pm!.id, { is_active: true }).then(() => queryClient.invalidateQueries());
          });
        },
        onError: (err) => toast(err.message),
      },
    );
  }

  return (
    <div className="flex animate-screen-in flex-col gap-[22px]">
      {back}
      <div className="grid items-start gap-7" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))" }}>
        <div className="flex flex-col gap-3.5">
          <div className="w-full max-w-[440px]">
            <CardArt look={cardLook(pm)} />
          </div>
          <div className="grid max-w-[440px] grid-cols-3 gap-2">
            {[
              { label: "Monthly", value: <DualAmount d={monthly} /> },
              { label: "Yearly", value: <DualAmount d={scaleDual(monthly, 12)} /> },
              { label: "Active", value: String(activeCount) },
            ].map((st) => (
              <div key={st.label} className="flex flex-col gap-[5px] rounded-[14px] bg-s1 px-3.5 py-3 shadow-lift">
                <span className="text-xs text-fg2">{st.label}</span>
                <span className="text-lg font-semibold tracking-[-0.03em] whitespace-nowrap tabular-nums">{st.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionTitle
            right={
              <button
                type="button"
                onClick={() => openSubscription(undefined, { payment_method_id: pm.id })}
                className="border-none bg-transparent p-0 text-sm text-fg2"
              >
                Add here
              </button>
            }
          >
            Billed to {labels.get(pm.id) ?? pm.display_name}
          </SectionTitle>
          {rows.length ? (
            <RowGroup>
              {rows.map((s, i) => (
                <SubRow key={s.id} {...subscriptionRow(s, pm, { divider: i > 0, onClick: () => openSubscription(s), showCard: false, label: labels.get(pm.id) })} />
              ))}
            </RowGroup>
          ) : (
            <div className="rounded-[18px] border border-dashed border-hair2 px-4 py-9 text-center text-sm text-fg2">
              Nothing is billed to this one yet.
            </div>
          )}
          {/* Not in the mockup: quiet extras below the list so the top matches the design. */}
          <div className="flex justify-center gap-5 pt-3">
            <button
              type="button"
              onClick={deactivate}
              disabled={update.isPending}
              className="border-none bg-transparent p-0 text-[13px] text-fg3 hover:text-fg2"
            >
              Hide this {pm.type === "upi" ? "app" : "card"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
