export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-[6px] font-semibold tracking-[0.08em]"
      style={{
        width: size,
        height: size,
        background: "var(--forest)",
        color: "var(--gold)",
        border: "1px solid color-mix(in srgb, var(--gold) 35%, transparent)",
        fontSize: size * 0.32,
        fontFamily: "var(--font-sans)",
      }}
      aria-hidden
    >
      HD
    </div>
  );
}
