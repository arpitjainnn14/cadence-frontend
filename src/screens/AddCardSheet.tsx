// "Add card": bank, card name, network and optional card art. The backend
// stores the image; we never ask for card numbers, CVV or expiry.
import { useEffect, useState } from "react";
import type { Network } from "../api/types";
import { CardArt } from "../components/CardArt";
import { CheckIcon, UploadIcon } from "../components/Icons";
import { Segmented } from "../components/Segmented";
import { FieldLabel, PrimaryButton, Sheet } from "../components/Sheet";
import { useAddCard } from "../data/queries";
import { CARD_COLORS, toneGradient, type CardLook } from "../lib/cardStyle";
import { useUi } from "../ui/UiContext";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Same rules as the backend, checked early so you get a friendly message. */
export function checkImage(file: File): string | null {
  if (!TYPES.includes(file.type)) return "Use a PNG, JPEG or WebP image.";
  if (file.size > MAX_BYTES) return "That image is over 2 MB.";
  return null;
}

type Net = Exclude<Network, null>;

export function AddCardSheet() {
  const { closeSheet, toast } = useUi();
  const add = useAddCard();
  const [bank, setBank] = useState("");
  const [name, setName] = useState("");
  const [network, setNetwork] = useState<Net>("visa");
  const [color, setColor] = useState(CARD_COLORS[0]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [showErrors, setShowErrors] = useState(false);
  const [error, setError] = useState("");

  // Show the picked photo on the card preview; free the blob URL afterwards.
  useEffect(() => {
    if (!image) return setPreview(undefined);
    const url = URL.createObjectURL(image);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const look: CardLook = {
    kind: "card",
    bank: bank || "Bank",
    name: name || "Card name",
    network,
    bg: toneGradient(color),
    image: preview,
  };

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const problem = checkImage(file);
    if (problem) return setError(problem);
    setError("");
    setImage(file);
  }

  function save() {
    if (!bank.trim() || !name.trim()) return setShowErrors(true);
    const form = new FormData();
    form.append("type", "credit_card");
    form.append("bank", bank.trim());
    form.append("name", name.trim());
    form.append("network", network);
    form.append("color", color);
    if (image) form.append("image", image);
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
                background: c,
                boxShadow: color === c ? "0 0 0 2px var(--color-s1), 0 0 0 4px var(--color-fg)" : "inset 0 0 0 1px rgba(255,255,255,0.1)",
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <FieldLabel>Card image</FieldLabel>
        {!image ? (
          <label className="flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-dashed border-hair2 bg-bg p-4 transition-colors duration-200 hover:border-fg2">
            <div className="grid h-10 w-10 flex-none place-items-center rounded-[11px] bg-s2 text-fg2">
              <UploadIcon size={18} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">Upload the card art</span>
              <span className="text-[12.5px] text-fg3">PNG, JPEG or WebP, up to 2 MB. Optional.</span>
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pick} className="hidden" />
          </label>
        ) : (
          <div className="flex animate-fade-in items-center gap-3 rounded-[14px] border border-hair2 bg-bg px-3.5 py-3">
            <CheckIcon size={18} className="flex-none" />
            <span className="min-w-0 flex-1 truncate text-sm">{image.name}</span>
            <button type="button" onClick={() => setImage(null)} className="border-none bg-transparent p-0 text-[13px] text-fg2">
              Remove
            </button>
          </div>
        )}
      </div>
      {(error || (showErrors && (!bank.trim() || !name.trim()))) && (
        <span role="alert" className="text-[13px] text-warn">
          {error || "Add the bank and the card's name."}
        </span>
      )}
    </Sheet>
  );
}
