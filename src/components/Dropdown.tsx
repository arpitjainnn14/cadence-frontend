// Filter pill with a pop-over menu (Sort / Category / Card on the Subscriptions screen).
import type { ReactNode } from "react";
import { CheckIcon, ChevronDown } from "./Icons";

export interface MenuItem {
  key: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  /** Small coloured square (categories). */
  dot?: string;
  /** Tiny card art (payment methods). */
  thumb?: string;
}

interface Props {
  label: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Filled (inverted) pill when a filter is active. */
  active?: boolean;
  items: MenuItem[];
  align?: "left" | "right";
  minWidth?: number;
}

export function Dropdown({ label, open, onToggle, active, items, align = "left", minWidth = 200 }: Props) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex h-[34px] items-center gap-[5px] rounded-[17px] border-none pr-2.5 pl-[13px] text-[13px] font-medium ${
          active ? "bg-inv text-invfg" : "bg-s2 text-fg"
        }`}
      >
        {label}
        <ChevronDown
          size={14}
          style={{ transition: "transform .3s cubic-bezier(.3,1.4,.4,1)", transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-10 z-30 max-h-[340px] animate-menu-in overflow-y-auto rounded-[14px] bg-s2 p-[5px] shadow-menu"
          style={{ minWidth, [align]: 0, transformOrigin: `top ${align}` }}
        >
          {items.map((m) => (
            <button
              key={m.key}
              role="menuitemradio"
              aria-checked={m.checked}
              type="button"
              onClick={m.onSelect}
              className="flex h-[38px] w-full items-center gap-2.5 rounded-[9px] border-none bg-transparent px-2.5 text-left text-sm text-fg hover:bg-s3"
            >
              {m.dot && <span className="h-2 w-2 rounded-[2px]" style={{ background: m.dot }} />}
              {m.thumb && <span className="h-[13px] w-5 flex-none rounded-[3px]" style={{ background: m.thumb }} />}
              <span className="flex-1 whitespace-nowrap">{m.label}</span>
              <CheckIcon size={15} style={{ opacity: m.checked ? 1 : 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
