import { motion as Motion } from "motion/react";
import {
  FaCopy,
  FaPhone,
  FaRegEnvelope,
  FaLocationDot,
  FaClock,
  FaArrowRightFromBracket,
  FaInstagram,
  FaFacebookF,
  FaXTwitter,
  FaTiktok,
  FaYoutube,
  FaLinkedinIn,
  FaYelp,
  FaGlobe,
} from "react-icons/fa6";
import ReservationButton from "../components/ui/ReservationButton";
import { useQuery } from "@tanstack/react-query";
import {
  getPublicAppSettings,
  trackPhoneAction,
  trackEmailAction,
} from "../lib/api";

export default function AboutPage() {
  const settingsQ = useQuery({
    queryKey: ["public-app-settings"],
    queryFn: getPublicAppSettings,
  });
  const settings = settingsQ.data || {};
  const OUT_BASE = (import.meta.env.VITE_API_BASE_URL || "") + "/api/out";
  const outHref = (url, name) =>
    `${OUT_BASE}?url=${encodeURIComponent(url)}$${
      name ? `&name=${encodeURIComponent(name)}` : ""
    }`.replace("$&", "&");

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
      className="space-y-6 p-3"
      initial="hidden"
      animate="show"
      variants={container}
    >
      <Motion.div
        initial="hidden"
        animate="show"
        variants={item}
        className="rounded-t-2xl overflow-hidden"
      >
        <img
          height={100}
          width={100}
          className=" w-full object-cover mask-b-from-50% max-h-64 "
          src="https://ik.imagekit.io/quolb5yjy/Restaurant%20Sign?updatedAt=1758685215874"
        ></img>
      </Motion.div>
      <Motion.h1 variants={item} className="text-3xl font-bold text-primary">
        About Us
      </Motion.h1>
      <Motion.p variants={item} className="text-muted leading-relaxed">
        Bisutoro is a modern bistro inspired by the harmony of Japanese and
        contemporary cuisine. Our menu evolves with the seasons, featuring
        locally sourced ingredients and thoughtfully crafted flavors.
      </Motion.p>
      <Motion.p variants={item} className="text-muted leading-relaxed">
        Founded with a passion for hospitality, we aim to create a warm,
        intimate dining experience. Whether you're here for a comforting bowl of
        ramen or an adventurous tasting flight, we strive to delight every
        guest.
      </Motion.p>

      <Motion.div variants={item}>
        <ReservationButton />
      </Motion.div>

      <Motion.div
        variants={item}
        className="gap-4 text-sm grid md:grid-cols-2 justify-between"
      >
        <div>
          <Motion.h2
            variants={item}
            className="font-semibold mb-1 text-muted text-lg"
          >
            Hours
          </Motion.h2>
          {settings.hours_of_operation_structured ? (
            <Motion.div variants={item}>
              <StructuredHoursDisplay
                hours={settings.hours_of_operation_structured}
              />
            </Motion.div>
          ) : settings.hours_of_operation ? (
            <Motion.pre
              variants={item}
              className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400"
            >
              {settings.hours_of_operation}
            </Motion.pre>
          ) : (
            <ul className="*:flex *:gap-2 *:items-center space-y-0.5 text-neutral-600 text-nowrap dark:text-neutral-400">
              <Motion.li variants={item}>
                <FaClock className="text-primary" /> Wed: 5:00pm – 9:30pm
              </Motion.li>
              <Motion.li variants={item}>
                <FaClock className="text-primary" /> Thu: 5:00pm – 9:30pm
              </Motion.li>
              <Motion.li variants={item}>
                <FaClock className="text-primary" /> Fri: 12:00am – 3:00pm /
                5:00pm - 10:00pm
              </Motion.li>
              <Motion.li variants={item}>
                <FaClock className="text-primary" /> Sat: 12:00am – 3:00pm /
                5:00pm - 10:00pm
              </Motion.li>
              <Motion.li variants={item}>
                <FaClock className="text-primary" /> Sun: 5:00pm – 9:00pm
              </Motion.li>
            </ul>
          )}
        </div>

        <div>
          <Motion.h2
            variants={item}
            className="font-semibold mb-1 text-muted text-lg"
          >
            Contact
          </Motion.h2>
          <ul className="space-y-2 *:flex *:items-center *:gap-2 text-neutral-600 dark:text-neutral-400 ">
            {settings.location && (
              <Motion.a
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                target="_blank"
                className="bg-primary text-base-fg p-2 rounded-2xl"
                href={outHref(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    settings.location
                  )}`,
                  "Maps"
                )}
                rel="noopener noreferrer"
              >
                <li className="flex items-center justify-between gap-2 w-full px-3">
                  <div className="flex items-center gap-2">
                    <FaLocationDot className="text-contrast" />
                    <h1 className="text-contrast">{settings.location}</h1>
                  </div>
                  <FaArrowRightFromBracket className="text-contrast" />
                </li>
              </Motion.a>
            )}

            {settings.contact_email && (
              <Motion.a
                whileHover={{ y: -1, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                target="_blank"
                className="bg-primary text-base-fg p-2 rounded-2xl"
                href={`mailto:${settings.contact_email}`}
                rel="noopener noreferrer"
                onClick={() =>
                  trackEmailAction({
                    email: settings.contact_email,
                    action: "click",
                  })
                }
              >
                <li className="flex items-center justify-between gap-2 w-full px-3">
                  <div className="flex items-center gap-2">
                    <FaRegEnvelope className="text-contrast" />
                    <h1 className="text-contrast">{settings.contact_email}</h1>
                  </div>
                  <FaArrowRightFromBracket className="text-contrast" />
                </li>
              </Motion.a>
            )}

            {settings.phone_number && (
              <li className="flex items-center justify-between gap-2 w-full ">
                <Motion.a
                  whileHover={{ y: -1, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  target="_blank"
                  className="bg-primary text-base-fg px-5 py-2 rounded-2xl flex-1"
                  href={`tel:${settings.phone_number.replace(/[^\d+]/g, "")}`}
                  rel="noopener noreferrer"
                  onClick={() =>
                    trackPhoneAction({
                      phone: settings.phone_number,
                      action: "click",
                    })
                  }
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <FaPhone className="text-contrast" />
                      <h1 className="text-contrast">{settings.phone_number}</h1>
                    </div>
                    <FaArrowRightFromBracket className="text-contrast" />
                  </div>
                </Motion.a>
                <button
                  className="ml-2 px-3 py-2 rounded-2xl border border-secondary/40 hover:bg-secondary/10 text-sm"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        settings.phone_number
                      );
                      await trackPhoneAction({
                        phone: settings.phone_number,
                        action: "copy",
                      });
                    } catch {
                      // ignore
                    }
                  }}
                  title="Copy phone number"
                >
                  <FaCopy />
                </button>
              </li>
            )}
          </ul>

          {settings.social_links && (
            <Motion.div variants={item} className="mt-3">
              <h3 className="font-semibold text-muted text-lg mb-1">
                Follow us
              </h3>
              <ul className="flex flex-wrap gap-2">
                {(Array.isArray(settings.social_links)
                  ? settings.social_links
                  : Object.entries(settings.social_links).map(
                      ([name, url]) => ({ name, url })
                    )
                ).map((s, i) => (
                  <li key={i}>
                    <Motion.a
                      whileHover={{ y: -1, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-secondary/40 bg-secondary/10 hover:bg-secondary/20 transition-colors"
                      href={outHref(s.url, s.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <SocialIcon name={s.name} url={s.url} />
                      <span className="text-sm text-base-fg">{s.name}</span>
                    </Motion.a>
                  </li>
                ))}
              </ul>
            </Motion.div>
          )}
        </div>
      </Motion.div>
    </Motion.div>
  );
}

function StructuredHoursDisplay({ hours }) {
  const order = [
    ["monday", "Mon"],
    ["tuesday", "Tue"],
    ["wednesday", "Wed"],
    ["thursday", "Thu"],
    ["friday", "Fri"],
    ["saturday", "Sat"],
    ["sunday", "Sun"],
  ];
  const hasAny = order.some(
    ([k]) => hours?.[k]?.morning || hours?.[k]?.evening
  );
  if (!hasAny) return null;
  return (
    <ul className="space-y-1 text-neutral-600 divide-y dark:text-neutral-400">
      {order.map(([key, label]) => {
        const v = hours?.[key];
        if (!v || (!v.morning && !v.evening)) return null;
        const morning = (v.morning || "closed").trim();
        const evening = (v.evening || "closed").trim();
        const mClosed = morning.toLowerCase() === "closed";
        const eClosed = evening.toLowerCase() === "closed";
        const bothClosed = mClosed && eClosed;
        return (
          <li
            key={key}
            className="flex items-center justify-between gap-3 min-h-12"
          >
            <div className="flex items-center gap-2 min-w-20">
              <FaClock className="text-primary" />
              <span className="font-medium">{label}</span>
            </div>
            <div className="flex flex-wrap gap-2 w-full">
              {bothClosed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 m-1 rounded-full text-xs text-muted">
                  Closed all day
                </span>
              ) : (
                <div className="p-1 text-muted">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 m-1 rounded-full border border-secondary/40 bg-secondary/10 text-xs">
                    <span className="text-primary">Morning:</span>
                    <span>{mClosed ? "Closed" : morning}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 m-1 rounded-full border border-secondary/40 bg-secondary/10 text-xs">
                    <span className="text-primary">Evening:</span>
                    <span>{eClosed ? "Closed" : evening}</span>
                  </span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SocialIcon({ name, url }) {
  const n = String(name || "").toLowerCase();
  const u = String(url || "").toLowerCase();
  const is = (s) => n.includes(s) || u.includes(s);
  const Icon = is("instagram")
    ? FaInstagram
    : is("facebook")
    ? FaFacebookF
    : is("twitter") || is("x.com") || is("x/") || is("x ")
    ? FaXTwitter
    : is("tiktok")
    ? FaTiktok
    : is("youtube")
    ? FaYoutube
    : is("linkedin")
    ? FaLinkedinIn
    : is("yelp")
    ? FaYelp
    : FaGlobe;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary">
      <Icon />
    </span>
  );
}
