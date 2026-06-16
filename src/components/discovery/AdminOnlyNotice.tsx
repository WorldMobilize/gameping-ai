export default function AdminOnlyNotice() {
  return (
    <p className="mt-6 rounded-2xl border border-dashed border-amber-300/90 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
      <span className="font-semibold uppercase tracking-[0.12em] text-amber-800">Admin only</span>
      {" — "}
      This page is a placeholder for internal testing. It is not linked in public navigation.
    </p>
  );
}
