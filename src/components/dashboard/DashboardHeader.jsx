export default function DashboardHeader({ search, onSearchChange }) {
  return (
    <header className="flex items-center justify-between gap-3 flex-wrap">
      <h1 className="text-2xl font-semibold">Items</h1>
      <input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="rounded-2xl p-2 border border-secondary/40 bg-background text-base-fg w-52"
      />
    </header>
  );
}
