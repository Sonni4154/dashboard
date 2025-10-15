export function JibbleBadge({ verified }: { verified: boolean }) {
  if (!verified) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
      <svg aria-hidden="true" viewBox="0 0 20 20" className="w-3 h-3"><path fill="currentColor" d="M7.667 13.233 4.7 10.267l1.4-1.4 1.567 1.566 5.233-5.233 1.4 1.4z"/></svg>
      Jibble Verified
    </span>
  );
}
