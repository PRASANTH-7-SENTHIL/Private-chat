export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin"
      role="status"
      aria-label="Loading"
    />
  );
}
