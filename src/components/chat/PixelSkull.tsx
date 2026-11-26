const rows = ["00111100", "01111110", "11111111", "11011011", "11011011", "01111110", "00111100", "00100100"];

export default function PixelSkull({ color = "#ef4444" }: { color?: string }) {
  return (
    <div
      aria-hidden="true"
      className="mx-auto grid w-16 grid-cols-8 [filter:drop-shadow(0_0_18px_rgba(239,68,68,0.45))]"
    >
      {rows.flatMap((row, y) =>
        [...row].map((pixel, x) => (
          <span
            key={`${y}-${x}`}
            className="aspect-square"
            style={{ background: pixel === "1" ? color : "transparent" }}
          />
        )),
      )}
    </div>
  );
}