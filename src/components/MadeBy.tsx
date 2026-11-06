// A quiet one-line credit for the bottom of Login and Settings. Uses the
// faintest text colour so it works in both themes without competing with
// the content.
export function MadeBy({ className = "" }: { className?: string }) {
  return (
    <p className={`m-0 text-center text-[12px] text-fg3 ${className}`}>
      Made by{" "}
      <a
        href="https://arpitjain.me"
        target="_blank"
        rel="noopener noreferrer"
        className="text-fg3 underline decoration-fg3/40 underline-offset-[3px] transition-colors hover:text-fg2"
      >
        Arpit Jain
      </a>
    </p>
  );
}
