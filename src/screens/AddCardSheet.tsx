// "Add card": bank, card name, network and colour, shown live on a drawn
// card. We never ask for card numbers, CVV or expiry.
import { useState } from "react";
import type { Network } from "../api/types";
import { CardArt } from "../components/CardArt";
import { Segmented } from "../components/Segmented";
import { FieldLabel, PrimaryButton, Sheet } from "../components/Sheet";
import { useAddCard } from "../data/queries";
import { CARD_COLORS, pastelOf, type CardLook } from "../lib/cardStyle";
import { useUi } from "../ui/UiContext";

type Net = Exclude<Network, null>;

export function AddCardSheet() {
  const { closeSheet, toast } = useUi();
  const add = useAddCard();
  const [bank, setBank] = useState("");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<Net>("visa");
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");

  const look: CardLook = {
    kind: "card",
    bank: bank || "Bank",
    name: name || "Card name",
    network,
    ...pastelOf(color),
  };

  function save() {
    if (!bank.trim() || !name.trim()) return setShowErrors(true);
    const form = new FormData();
    form.append("type", "credit_card");
    form.append("bank", bank.trim());
    form.append("name", name.trim());
    form.append("network", network);
    form.append("color", color);
    add.mutate(form, {
      onSuccess: (pm) => {
        closeSheet();
        toast(`${pm.display_name} added`);
      },
      onError: (err) => setError(err.message),
    });
  }

  const border = (v: string) => (showErrors && !v.trim() ? "var(--color-warn)" : undefined);

  return (
    <Sheet
      title="Add card"
      footer={
        <PrimaryButton type="button" onClick={save} disabled={add.isPending}>
          {add.isPending ? "Adding…" : "Add card"}
        </PrimaryButton>
      }
    >
      <div className="w-full max-w-[330px] self-center">
        <CardArt look={look} />
      </div>
      <label className="flex flex-col gap-2">
        <FieldLabel>Bank</FieldLabel>
        <input value={bank} onChange={(e) => setBank(e.target.value)} placeholder="e.g. Axis Bank" className="field" style={{ borderColor: border(bank) }} />
      </label>
      <label className="flex flex-col gap-2">
        <FieldLabel>Card name</FieldLabel>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Magnus" className="field" style={{ borderColor: border(name) }} />
      </label>
      <div className="flex flex-col gap-2">
        <FieldLabel>Network</FieldLabel>
        <Segmented<Net>
          tone="inset"
          height={36}
          value={network}
          onChange={setNetwork}
          options={[
            { value: "visa", label: "Visa" },
            { value: "mastercard", label: "Mastercard" },
            { value: "rupay", label: "RuPay" },
          ]}
        />
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Card colour</FieldLabel>
        <div className="flex gap-2.5" role="radiogroup" aria-label="Card colour">
          {CARD_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className="h-[34px] w-[34px] rounded-[17px] border-none transition-shadow duration-200"
              style={{
                // The pastel the card will get, with its wordmark colour as the edge.
                background: pastelOf(c).bg,
                boxShadow:
                  color === c
                    ? `inset 0 0 0 2px ${pastelOf(c).ink}, 0 0 0 2px var(--color-s1), 0 0 0 4px var(--color-fg)`
                    : `inset 0 0 0 2px ${pastelOf(c).ink}`,
              }}
            />
          ))}
        </div>
      </div>
      {(error || (showErrors && (!bank.trim() || !name.trim()))) && (
        <span role="alert" className="text-[13px] text-warn">
          {error || "Add the bank and the card's name."}
        </span>
      )}
    </Sheet>
  );
}
