export default function DashboardPage() {
  return (
    <div className="space-y-6 max-w-screen overflow-hidden p-3 text-base-fg">
      <div className="p-4 rounded-2xl border border-secondary/40">
        <h2 className="text-xl font-semibold">Items moved</h2>
        <p className="text-muted mt-1">
          The items management has moved to <code>/dashboard/items</code>.
          Please use the sidebar navigation.
        </p>
      </div>
    </div>
  );
}
