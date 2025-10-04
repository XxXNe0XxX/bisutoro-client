import { Link } from "react-router-dom";
import ReservationButton from "../components/ui/ReservationButton";
import { motion as Motion } from "motion/react";

export default function OmakasePage() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
  };
  const item = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  };

  return (
    <Motion.div
      className="space-y-6 p-3 text-base-fg"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <Motion.header variants={item} className="space-y-2">
        <Motion.h1 variants={item} className="text-3xl text-primary font-bold">
          Omakase
        </Motion.h1>
        <Motion.p variants={item} className="max-w-prose text-muted">
          Omakase ("I leave it up to you") is a chef’s choice tasting menu.
          Relax and let our chef curate a seasonal progression of dishes that
          highlight the freshest ingredients and our kitchen’s creativity.
        </Motion.p>
      </Motion.header>

      <Motion.section variants={item} className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "How it works",
            points: [
              "Chef-crafted, multi-course experience",
              "Courses change frequently and seasonally",
              "Plan for ~90 minutes from start to finish",
            ],
          },
          {
            title: "Dietary notes",
            points: [
              "We happily accommodate common allergies",
              "Vegetarian and gluten-free options available",
              "Please share restrictions with your server",
            ],
          },
          {
            title: "Pricing",
            points: [
              "Fixed per-person pricing, service not included",
              "Optional beverage pairings available",
              "Ask your server for today’s details",
            ],
          },
        ].map((card, i) => (
          <Motion.div
            key={i}
            variants={item}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="rounded-2xl border border-secondary/40 p-4 bg-secondary/10"
          >
            <h2 className="font-semibold mb-1">{card.title}</h2>
            <ul className="list-disc list-inside text-sm text-muted space-y-1">
              {card.points.map((p, j) => (
                <li key={j}>{p}</li>
              ))}
            </ul>
          </Motion.div>
        ))}
      </Motion.section>

      <Motion.section variants={item} className="space-y-2 max-w-prose">
        <Motion.h2 variants={item} className="text-xl font-semibold">
          Is Omakase right for me?
        </Motion.h2>
        <Motion.p variants={item} className="text-muted">
          If you enjoy trying new flavors and trust the chef to guide your meal,
          Omakase is a perfect fit. Prefer to choose each dish? Explore our
          regular menu instead — you can always add an Omakase experience next
          time.
        </Motion.p>
        <Motion.div
          variants={item}
          className="flex flex-wrap gap-4 py-2 mb-12 items-center"
        >
          <Motion.div
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/menu"
              className="p-3 font-semibold text-nowrap text-center rounded-2xl bg-primary text-contrast "
            >
              View the Menu
            </Link>
          </Motion.div>
          <Motion.div
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ReservationButton />
          </Motion.div>
        </Motion.div>
      </Motion.section>
    </Motion.div>
  );
}
