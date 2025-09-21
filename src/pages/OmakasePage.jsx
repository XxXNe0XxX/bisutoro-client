import { Link } from "react-router-dom";
import ReservationButton from "../components/ui/ReservationButton";

export default function OmakasePage() {
  return (
    <div className="space-y-6 p-3 text-base-fg">
      <header className="space-y-2">
        <h1 className="text-3xl text-primary font-bold">Omakase</h1>
        <p className="max-w-prose text-muted">
          Omakase ("I leave it up to you") is a chef’s choice tasting menu.
          Relax and let our chef curate a seasonal progression of dishes that
          highlight the freshest ingredients and our kitchen’s creativity.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-secondary/40 p-4 bg-secondary/10">
          <h2 className="font-semibold mb-1">How it works</h2>
          <ul className="list-disc list-inside text-sm text-muted space-y-1">
            <li>Chef-crafted, multi-course experience</li>
            <li>Courses change frequently and seasonally</li>
            <li>Plan for ~90 minutes from start to finish</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-secondary/40 p-4 bg-secondary/10">
          <h2 className="font-semibold mb-1">Dietary notes</h2>
          <ul className="list-disc list-inside text-sm text-muted space-y-1">
            <li>We happily accommodate common allergies</li>
            <li>Vegetarian and gluten-free options available</li>
            <li>Please share restrictions with your server</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-secondary/40 p-4 bg-secondary/10">
          <h2 className="font-semibold mb-1">Pricing</h2>
          <ul className="list-disc list-inside text-sm text-muted space-y-1">
            <li>Fixed per-person pricing, service not included</li>
            <li>Optional beverage pairings available</li>
            <li>Ask your server for today’s details</li>
          </ul>
        </div>
      </section>

      <section className="space-y-2 max-w-prose">
        <h2 className="text-xl font-semibold">Is Omakase right for me?</h2>
        <p className="text-muted">
          If you enjoy trying new flavors and trust the chef to guide your meal,
          Omakase is a perfect fit. Prefer to choose each dish? Explore our
          regular menu instead — you can always add an Omakase experience next
          time.
        </p>
        <div className="flex gap-2 pt-2">
          <Link
            to="/menu"
            className="px-3 py-2 font-semibold text-center rounded-2xl bg-primary text-contrast "
          >
            View the Menu
          </Link>
          <ReservationButton />
        </div>
      </section>
    </div>
  );
}
