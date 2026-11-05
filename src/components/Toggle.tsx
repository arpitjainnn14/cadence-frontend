/** The small iOS-style switch from the design (36×22). Purely visual; wrap it in a button. */
export function Toggle({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className="relative inline-block h-[22px] w-9 flex-none rounded-[11px] transition-colors duration-250"
      style={{ background: on ? "var(--color-track-on)" : "var(--color-s3)" }}
    >
      <span
        className="absolute top-0.5 h-[18px] w-[18px] rounded-[9px] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        style={{ left: on ? 16 : 2, transition: "left .35s cubic-bezier(.3,1.3,.4,1)" }}
      />
    </span>
  );
}
