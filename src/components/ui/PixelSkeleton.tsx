type Props = {
  className?: string;
  lines?: number;
};

export default function PixelSkeleton({ className = "", lines = 3 }: Props) {
  return (
    <div
      className={`animate-pulse border border-zinc-800 bg-[#101010] p-6 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: lines }, (_, i) => (
        <div
          key={i}
          className="mb-3 h-4 bg-zinc-800"
          style={{ width: `${90 - i * 15}%` }}
        />
      ))}
    </div>
  );
}