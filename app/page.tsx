"use client";

import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ArrowUpDown,
  Building2,
  CalendarDays,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Menu,
  Moon,
  PawPrint,
  Phone,
  Presentation,
  ShowerHead,
  Snowflake,
  Sun,
  Tv,
  UtensilsCrossed,
  Warehouse,
  Wifi,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { CSSProperties, ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* DATI. Tutto cio' che e' verificato sta qui. I campi vuoti sono      */
/* DA FORNIRE dal cliente: la pagina non li inventa.                   */
/* ------------------------------------------------------------------ */

const HOTEL = {
  name: "Old River Hotel & Ristorante",
  phone: "0522 838401",
  phoneHref: "tel:+390522838401",
  address: "Viale Po 2, 42016 Guastalla (RE)",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Old+River+Hotel+Viale+Po+2+Guastalla",
  email: "", // DA FORNIRE: senza email il modulo non apre il client di posta
  piva: "", // DA FORNIRE: P.IVA e ragione sociale
  social: [] as { label: string; href: string }[], // DA FORNIRE
};

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT ?? "";

const NAV = [
  { href: "#camere", label: "Camere" },
  { href: "#ristorante", label: "Ristorante" },
  { href: "#aziende", label: "Aziende" },
  { href: "#dove", label: "Dove siamo" },
  { href: "#contatti", label: "Contatti" },
];

// Le dotazioni sono quelle confermate dalla scheda turistica ufficiale.
// Le tipologie di camera NON sono confermate: le tre schede raccontano gli
// ambienti, non categorie commerciali. Immagini generate, rappresentative.
const ROOMS = [
  {
    name: "La camera",
    line: "Un posto dove spegnere la giornata.",
    img: "/img/camera.jpg",
    feats: [
      { icon: Tv, label: "TV satellitare" },
      { icon: Snowflake, label: "Aria condizionata" },
      { icon: Coffee, label: "Minibar" },
    ],
  },
  {
    name: "Il bagno",
    line: "Doccia, asciugacapelli, tutto a portata di mano.",
    img: "/img/bagno.jpg",
    feats: [
      { icon: ShowerHead, label: "Bagno con doccia" },
      { icon: Check, label: "Asciugacapelli" },
      { icon: Snowflake, label: "Riscaldamento" },
    ],
  },
  {
    name: "Per chi lavora",
    line: "Connessione, telefono in camera e cassaforte.",
    img: "/img/lavoro.jpg",
    feats: [
      { icon: Wifi, label: "Wi-Fi" },
      { icon: Phone, label: "Telefono in camera" },
      { icon: Lock, label: "Cassaforte" },
    ],
  },
];

const SERVICES = [
  { icon: Car, title: "Parcheggio custodito", text: "Ampio, sorvegliato, per chi arriva in auto.", span: "md:col-span-2" },
  { icon: Warehouse, title: "Garage privato", text: "Per chi vuole la macchina al coperto.", span: "" },
  { icon: Presentation, title: "Sala congressi", text: "Per riunioni, formazione ed eventi aziendali.", span: "" },
  { icon: Wifi, title: "Wi-Fi", text: "In tutta la struttura.", span: "" },
  { icon: Clock, title: "Reception sempre aperta", text: "Aperti tutto l'anno, chiusi solo il 25 dicembre.", span: "md:col-span-2" },
  { icon: ArrowUpDown, title: "Ascensore", text: "Ai piani, senza scale.", span: "" },
  { icon: PawPrint, title: "Animali di piccola taglia", text: "Ammessi in struttura.", span: "" },
  { icon: CreditCard, title: "Pagamento con carta", text: "Le principali carte di credito.", span: "" },
];

/* ------------------------------------------------------------------ */
/* HERO: configurazione del viaggio (3 capitoli, ~20 s di scrub)       */
/* ------------------------------------------------------------------ */

const HERO_VH = 1100; // altezza del hero in vh: scroll range = 1000vh
const VIDEO_URL = "/video/hero-scrub.mp4";
const VIDEO_BYTES = 11173475; // dimensione reale del file, fallback se manca Content-Length
const POSTER = "/video/hero-poster.jpg";
const ENDING = "/video/hero-ending.jpg";

type Fx = "drift" | "blur" | "approach";
const BANDS: { a: number; b: number; text: string; fx: Fx; pos: string }[] = [
  { a: 0.0, b: 0.22, text: "Guastalla, terra di Gonzaga.", fx: "drift", pos: "top-[16%] left-6 md:left-16" },
  { a: 0.27, b: 0.47, text: "Dove il Po rallenta.", fx: "blur", pos: "top-[16%] left-6 md:left-16" },
  { a: 0.56, b: 0.76, text: "Old River.|Il tuo posto sul fiume.", fx: "approach", pos: "top-[14%] left-6 md:left-16" },
];
const SETTLE_A = 0.86;

// I cinque gate dell'hero statico: identici in JS e (dove serve) in CSS.
const GATES = [
  "(max-width: 720px)",
  "(orientation: portrait) and (max-width: 1024px)",
  "(orientation: portrait) and (pointer: coarse)",
  "(orientation: landscape) and (pointer: coarse) and (max-height: 560px)",
  "(prefers-reduced-motion: reduce)",
];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smoothstep = (p: number, e0: number, e1: number) => {
  const t = clamp((p - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const css = (o: Record<string, string | number>) => o as unknown as CSSProperties;

/** prefers-reduced-motion, sicuro per l'idratazione (server = false), reattivo nei due sensi. */
function useReduced(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false
  );
}

/** null = non ancora deciso (SSR/primo paint), poi 'scrub' o 'static', aggiornato live. */
function useHeroMode(): "scrub" | "static" | null {
  const [mode, setMode] = useState<"scrub" | "static" | null>(null);
  useEffect(() => {
    const mqls = GATES.map((q) => window.matchMedia(q));
    const apply = () => setMode(mqls.some((m) => m.matches) ? "static" : "scrub");
    apply();
    mqls.forEach((m) => m.addEventListener("change", apply));
    return () => mqls.forEach((m) => m.removeEventListener("change", apply));
  }, []);
  return mode;
}

/* ------------------------------------------------------------------ */
/* Piccoli blocchi condivisi                                           */
/* ------------------------------------------------------------------ */

function Label({ children, light = false }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className={`mb-5 text-xs font-semibold uppercase tracking-[0.5em] ${
        light ? "text-ink-soft" : "text-stone"
      }`}
    >
      {children}
    </p>
  );
}

function Rule({ light = false }: { light?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <div ref={ref} aria-hidden="true" className="mb-10 h-px w-full max-w-xs overflow-hidden">
      <motion.div
        className={`h-px origin-left ${light ? "bg-black/30" : "bg-stone/50"}`}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function Stars({ light = false }: { light?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 14"
      className={`mb-6 h-4 w-14 ${light ? "text-black/50" : "text-stone/80"}`}
      fill="currentColor"
    >
      <polygon points="7.0,1.8 8.3,5.2 11.9,5.4 9.1,7.7 10.1,11.2 7.0,9.2 3.9,11.2 4.9,7.7 2.1,5.4 5.7,5.2" />
      <polygon points="24.0,1.8 25.3,5.2 28.9,5.4 26.1,7.7 27.1,11.2 24.0,9.2 20.9,11.2 21.9,7.7 19.1,5.4 22.7,5.2" />
      <polygon points="41.0,1.8 42.3,5.2 45.9,5.4 43.1,7.7 44.1,11.2 41.0,9.2 37.9,11.2 38.9,7.7 36.1,5.4 39.7,5.2" />
    </svg>
  );
}

const btnBase =
  "inline-flex min-h-[48px] items-center justify-center gap-2 px-7 text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-500";
const btnSolid = `${btnBase} bg-white text-black hover:bg-stone`;
const btnOutline = `${btnBase} border border-white/60 text-white hover:bg-white hover:text-black`;

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function Header({ onBook }: { onBook: () => void }) {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-700 ${
        solid || open
          ? "border-white/10 bg-ink/70 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div
        className={`mx-auto flex max-w-[1400px] items-center justify-between px-6 transition-all duration-700 md:px-10 ${
          solid ? "py-2" : "py-4"
        }`}
      >
        <a href="#top" aria-label="Old River Hotel, torna in cima" className="block">
          <Image
            src="/img/logo-negative.png"
            alt="Old River Hotel"
            width={1500}
            height={900}
            priority
            className={`w-auto transition-all duration-700 ${solid ? "h-10" : "h-14 md:h-16"}`}
          />
        </a>

        <nav aria-label="Principale" className="hidden items-center gap-9 lg:flex">
          {NAV.map((n) => (
            <a
              key={n.href}
              href={n.href}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80 transition-colors hover:text-white"
            >
              {n.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href={HOTEL.phoneHref}
            className="hidden items-center gap-2 text-sm font-semibold text-white/90 hover:text-white md:flex"
          >
            <Phone size={18} strokeWidth={1.5} aria-hidden="true" />
            {HOTEL.phone}
          </a>
          <button onClick={onBook} className={`${btnSolid} hidden min-h-[40px] md:inline-flex`}>
            Prenota
          </button>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 lg:hidden"
            aria-label={open ? "Chiudi il menu" : "Apri il menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-x-0 bottom-0 top-[64px] z-40 flex flex-col justify-between bg-ink px-6 pb-10 pt-10 lg:hidden"
          >
            <nav aria-label="Menu mobile" className="flex flex-col gap-7">
              {NAV.map((n, i) => (
                <motion.a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="text-4xl font-light tracking-tight text-white"
                >
                  {n.label}
                </motion.a>
              ))}
            </nav>
            <div className="flex flex-col gap-4">
              <a href={HOTEL.phoneHref} className={btnOutline}>
                <Phone size={20} strokeWidth={1.5} aria-hidden="true" /> {HOTEL.phone}
              </a>
              <button
                className={btnSolid}
                onClick={() => {
                  setOpen(false);
                  onBook();
                }}
              >
                Verifica disponibilità
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Barra di prenotazione (precompila il modulo, nessun motore trovato)  */
/* ------------------------------------------------------------------ */

type Prefill = {
  arrival?: string;
  departure?: string;
  guests?: string;
  message?: string;
  mode?: "privato" | "azienda";
  nonce: number;
};

function BookingBar({ onSubmit }: { onSubmit: (p: Prefill) => void }) {
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [guests, setGuests] = useState("2");
  const arrivalRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // la data minima si imposta nel browser, mai nel prerender
    if (arrivalRef.current) arrivalRef.current.min = new Date().toISOString().slice(0, 10);
  }, []);

  const field =
    "w-full border-0 border-b border-white/40 bg-transparent px-0 py-2 text-base font-normal text-white outline-none [color-scheme:dark] focus:border-white";
  const lbl = "mb-1 block text-[11px] font-semibold uppercase tracking-[0.3em] text-stone";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ arrival, departure, guests, mode: "privato", nonce: Date.now() });
      }}
      aria-label="Verifica disponibilità"
      className="tshadow-none w-full max-w-3xl border border-white/20 bg-ink/70 p-5 backdrop-blur-md md:p-6"
    >
      <div className="grid grid-cols-2 items-end gap-x-6 gap-y-5 md:grid-cols-[1fr_1fr_0.7fr_auto]">
        <div>
          <label htmlFor="bb-arrivo" className={lbl}>
            Arrivo
          </label>
          <input
            id="bb-arrivo"
            ref={arrivalRef}
            type="date"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="bb-partenza" className={lbl}>
            Partenza
          </label>
          <input
            id="bb-partenza"
            type="date"
            min={arrival || undefined}
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            className={field}
          />
        </div>
        <div>
          <label htmlFor="bb-ospiti" className={lbl}>
            Ospiti
          </label>
          <select
            id="bb-ospiti"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className={`${field} [&>option]:bg-ink`}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={`${btnSolid} col-span-2 md:col-span-1`}>
          Verifica disponibilità
        </button>
      </div>
      <p className="mt-4 text-sm text-white/80">
        Prenota direttamente con noi: rispondiamo noi, non un call center.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Hero cinematografico: scrub del video guidato dallo scroll          */
/* ------------------------------------------------------------------ */

function Words({ text, fx }: { text: string; fx: Fx }) {
  const words = text.replace("|", " ").split(" ");
  const n = words.length;
  const breakAfter = text.includes("|") ? text.split("|")[0].split(" ").length : -1;
  return (
    <>
      <span className="sr-only">{text.replace("|", " ")}</span>
      <span aria-hidden="true" className="inline-flex flex-wrap gap-x-[0.28em]">
        {words.map((w, i) => {
          const th = ((i / n) * 0.55).toFixed(3);
          const kc = `clamp(0,calc((var(--k,0) - ${th})*2.8),1)`;
          const style =
            fx === "drift"
              ? css({ opacity: kc, transform: `translateY(calc((1 - ${kc})*-26px))` })
              : fx === "approach"
              ? css({ opacity: kc, transform: `scale(calc(0.8 + 0.2*${kc}))`, transformOrigin: "left center" })
              : css({});
          return (
            <span key={i} className="contents">
              <span className="inline-block will-change-transform" style={style}>
                {w}
              </span>
              {i === breakAfter - 1 && <span className="basis-full" />}
            </span>
          );
        })}
      </span>
    </>
  );
}

function Hero({
  mode,
  onSubmit,
  onBook,
}: {
  mode: "scrub" | "static" | null;
  onSubmit: (p: Prefill) => void;
  onBook: () => void;
}) {
  const heroRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const endingRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const ringWrapRef = useRef<HTMLDivElement>(null);
  const bandRefs = useRef<(HTMLDivElement | null)[]>([]);
  const settleRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (mode !== "scrub") return;
    const hero = heroRef.current;
    const video = videoRef.current;
    if (!hero || !video) return;
    video.setAttribute("tabindex", "-1");

    let target = 0;
    let shown = 0;
    let rafId: number | null = null;
    let lastTick = 0;
    let heroOnScreen = true;
    let seekBusy = false;
    let pendingTime: number | null = null;
    let loadK = 0;
    let videoReady = false;
    let disposed = false;
    const cache = bandRefs.current.map(() => ({ op: -1, k: -1 }));
    const settleCache = { op: -1, k: -1, ks: -1, kb: -1 };
    let endingOp = -1;

    const heroProgress = () => {
      const rect = hero.getBoundingClientRect();
      const range = hero.offsetHeight - window.innerHeight;
      return clamp(-rect.top / Math.max(1, range), 0, 1);
    };

    const updateCaptions = (p: number) => {
      BANDS.forEach((b, i) => {
        const el = bandRefs.current[i];
        if (!el) return;
        const f = Math.min(0.02, (b.a === 0 ? b.b : b.b - b.a) / 3);
        const inRamp = b.a === 0 ? 1 : smoothstep(p, b.a, b.a + f);
        const op = inRamp * (1 - smoothstep(p, b.b - f, b.b));
        const ramp = Math.min(0.025, (b.b - b.a) * 0.35);
        let k = clamp((p - b.a) / ramp, 0, 1);
        if (i === 0) k = Math.max(k, loadK);
        const c = cache[i];
        if (Math.abs(op - c.op) > 0.01 || (op === 0) !== (c.op === 0)) {
          c.op = op;
          el.style.opacity = String(op);
          el.style.visibility = op < 0.01 ? "hidden" : "visible";
        }
        if (Math.abs(k - c.k) > 0.008 || (k === 1) !== (c.k === 1)) {
          c.k = k;
          el.style.setProperty("--k", k.toFixed(3));
        }
      });
      const s = settleRef.current;
      if (s) {
        const op = smoothstep(p, SETTLE_A, SETTLE_A + 0.04);
        const k = clamp((p - SETTLE_A) / 0.06, 0, 1);
        const ks = clamp((k - 0.5) * 3, 0, 1);
        const kb = clamp((k - 0.7) * 4, 0, 1);
        if (Math.abs(op - settleCache.op) > 0.01 || (op === 0) !== (settleCache.op === 0)) {
          settleCache.op = op;
          s.style.opacity = String(op);
          s.style.visibility = op < 0.01 ? "hidden" : "visible";
        }
        if (Math.abs(k - settleCache.k) > 0.008) {
          settleCache.k = k;
          s.style.setProperty("--k", k.toFixed(3));
        }
        if (Math.abs(ks - settleCache.ks) > 0.008) {
          settleCache.ks = ks;
          s.style.setProperty("--ks", ks.toFixed(3));
        }
        if (Math.abs(kb - settleCache.kb) > 0.008) {
          settleCache.kb = kb;
          s.style.setProperty("--kb", kb.toFixed(3));
        }
      }
      // se il video non c'e', il fotogramma finale prende il suo posto
      const e = endingRef.current;
      if (e) {
        const eo = videoReady ? 0 : smoothstep(p, 0.5, 0.85);
        if (Math.abs(eo - endingOp) > 0.01) {
          endingOp = eo;
          e.style.opacity = String(eo);
        }
      }
    };

    const requestSeek = (t: number) => {
      if (!video.duration || !isFinite(video.duration)) return;
      if (seekBusy) {
        pendingTime = t;
        return;
      }
      seekBusy = true;
      video.currentTime = t;
    };
    const onSeeked = () => {
      seekBusy = false;
      if (pendingTime !== null) {
        const t = pendingTime;
        pendingTime = null;
        requestSeek(t);
      }
    };
    const onVideoError = () => {
      seekBusy = false;
      pendingTime = null;
      if (!videoReady) setFailed(true);
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onVideoError);

    const tick = (now: number) => {
      const dt = Math.min(100, now - (lastTick || now));
      lastTick = now;
      shown += (target - shown) * (1 - Math.pow(1 - 0.16, dt / 16.667));
      if (Math.abs(target - shown) < 0.0005) {
        shown = target;
        rafId = null;
        lastTick = 0;
      } else {
        rafId = requestAnimationFrame(tick);
      }
      if (videoReady) requestSeek(shown * video.duration);
      updateCaptions(shown);
    };
    const kick = () => {
      if (rafId === null && heroOnScreen) rafId = requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = heroProgress();
      kick();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    const io = new IntersectionObserver(
      ([entry]) => {
        heroOnScreen = entry.isIntersecting;
        if (heroOnScreen) kick();
      },
      { threshold: 0 }
    );
    io.observe(hero);

    // la prima banda si apre gia' composta: rampa di caricamento a tempo
    const t0 = performance.now();
    const loadRamp = (now: number) => {
      if (disposed) return;
      loadK = smoothstep(now - t0, 150, 1500);
      updateCaptions(shown);
      if (loadK < 1) requestAnimationFrame(loadRamp);
    };
    requestAnimationFrame(loadRamp);

    target = heroProgress();
    shown = target;
    updateCaptions(shown);

    // Blob in streaming con anello: la pagina e' completa anche senza video
    const ring = ringRef.current;
    const loadBlob = async () => {
      const ctrl = new AbortController();
      let dog = window.setTimeout(() => ctrl.abort(), 20000);
      try {
        const res = await fetch(VIDEO_URL, { priority: "low", signal: ctrl.signal } as RequestInit);
        if (!res.ok || !res.body) throw new Error("video");
        const total = Number(res.headers.get("Content-Length")) || VIDEO_BYTES;
        const reader = res.body.getReader();
        const chunks: BlobPart[] = [];
        let got = 0;
        let lastRing = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          window.clearTimeout(dog);
          dog = window.setTimeout(() => ctrl.abort(), 20000);
          chunks.push(value as BlobPart);
          got += value.length;
          const now = performance.now();
          if (ring && (now - lastRing > 100 || got >= total)) {
            lastRing = now;
            ring.style.strokeDashoffset = String(Math.round(126 * (1 - Math.min(1, got / total))));
          }
        }
        window.clearTimeout(dog);
        if (disposed) return;
        video.src = URL.createObjectURL(new Blob(chunks, { type: "video/mp4" }));
        video.load();
        video.addEventListener(
          "canplay",
          () => {
            videoReady = true;
            video.style.opacity = "1";
            if (ringWrapRef.current) ringWrapRef.current.style.opacity = "0";
            requestSeek(heroProgress() * video.duration);
            updateCaptions(shown);
          },
          { once: true }
        );
      } catch {
        window.clearTimeout(dog);
        if (!disposed) setFailed(true);
        if (ringWrapRef.current) ringWrapRef.current.style.opacity = "0";
      }
    };
    // il poster vince la gara di banda: il video parte dopo il poster
    const posterImg = new window.Image();
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      void loadBlob();
    };
    posterImg.onload = start;
    posterImg.onerror = start;
    posterImg.src = POSTER;
    const safety = window.setTimeout(start, 4000);

    return () => {
      disposed = true;
      window.clearTimeout(safety);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onVideoError);
      io.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (video.src.startsWith("blob:")) URL.revokeObjectURL(video.src);
    };
  }, [mode]);

  if (mode !== "scrub") {
    // Hero statico (telefoni, tablet in verticale, movimento ridotto): un layout
    // composto, non una toppa. Foto vera in alto, testi su fondo pieno sotto.
    return (
      <section id="top" aria-label="Old River Hotel & Ristorante" className="relative bg-ink">
        <div className="relative h-[54svh] min-h-[320px] overflow-hidden md:h-[62vh]">
          <Image
            src={ENDING}
            alt="Facciata dell'Old River Hotel a Guastalla, con la pensilina in legno, l'ulivo e i cipressi"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_30%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(8,7,7,.55) 0%, rgba(8,7,7,0) 28%, rgba(8,7,7,0) 62%, rgba(11,10,10,1) 100%)",
            }}
          />
        </div>
        <div className="relative mx-auto -mt-10 max-w-[1400px] px-6 pb-14 md:px-10">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.5em] text-stone">
            Old River Hotel · Ristorante
          </p>
          <h1 className="max-w-[18ch] text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-6xl">
            Una sosta sul Po, a Guastalla.
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-white/90">
            Camere, ristorante e sale per chi viaggia per lavoro e per chi cerca un posto dove fermarsi.
          </p>
          <div className="mt-8">
            <BookingBar onSubmit={onSubmit} />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a href="#aziende" className={btnOutline}>
                Soggiorni per aziende
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isScrub = mode === "scrub";
  const wordsRise = (text: string) =>
    text.split(" ").map((w, i, arr) => {
      const th = ((i / arr.length) * 0.5).toFixed(3);
      const kc = `clamp(0,calc((var(--k,1) - ${th})*3),1)`;
      return (
        <span
          key={i}
          className="inline-block"
          style={css({ opacity: kc, transform: `translateY(calc((1 - ${kc})*26px))` })}
        >
          {w}
          {" "}
        </span>
      );
    });

  return (
    <section
      id="top"
      ref={heroRef}
      aria-label="Old River Hotel & Ristorante"
      className="relative"
      style={isScrub ? { height: `${HERO_VH}vh` } : undefined}
    >
      <div
        className={`${
          isScrub ? "sticky top-0 h-[100svh]" : "relative min-h-[100svh]"
        } overflow-hidden bg-ink`}
      >
        {/* sfondo: poster (primo frame) in scrub, fotogramma finale in statico */}
        <Image
          src={isScrub || mode === null ? "/video/hero-poster.jpg" : "/video/hero-ending.jpg"}
          alt={isScrub || mode === null ? "" : "Facciata dell'Old River Hotel a Guastalla, con la pensilina in legno, l'ulivo e i cipressi"}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {isScrub && (
          <>
            <video
              ref={videoRef}
              preload="none"
              muted
              playsInline
              aria-hidden="true"
              tabIndex={-1}
              style={{ opacity: 0, transition: "opacity 0.8s", willChange: "transform" }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div ref={endingRef} aria-hidden="true" className="absolute inset-0" style={{ opacity: 0 }}>
              <Image src={ENDING} alt="" fill sizes="100vw" className="object-cover" />
            </div>
          </>
        )}

        {/* scrim globale */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,12,.5) 0%, rgba(10,10,12,0) 48%), radial-gradient(ellipse 120% 90% at 50% 45%, rgba(10,10,12,0) 35%, rgba(10,10,12,.62) 100%)",
          }}
        />

        {/* bande di caption nel capitolo */}
        {isScrub &&
          BANDS.map((b, i) => (
            <div
              key={i}
              ref={(el) => {
                bandRefs.current[i] = el;
              }}
              className={`tshadow pointer-events-none absolute isolate ${b.pos} max-w-[90vw] md:max-w-[34ch]`}
              style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}
            >
              <span
                aria-hidden="true"
                className="absolute -inset-[35%] -z-10"
                style={{
                  background:
                    "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(5,5,10,.82) 0%, rgba(5,5,10,.62) 52%, rgba(5,5,10,0) 100%)",
                }}
              />
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.5em] text-white">
                {["Guastalla", "Il Po", "Old River"][i]}
              </p>
              <h2 className="text-4xl font-light leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                {b.fx === "blur" ? (
                  <>
                    <span className="sr-only">{b.text.replace("|", " ")}</span>
                    <span aria-hidden="true" className="relative block">
                      <span
                        className="block"
                        style={css({ filter: "blur(10px)", opacity: "calc(1 - var(--k,0))" })}
                      >
                        {b.text.replace("|", " ")}
                      </span>
                      <span className="absolute inset-0 block" style={css({ opacity: "var(--k,0)" })}>
                        {b.text.replace("|", " ")}
                      </span>
                    </span>
                  </>
                ) : (
                  <Words text={b.text} fx={b.fx} />
                )}
              </h2>
            </div>
          ))}

        {/* arrivo: titolo, valore, prenotazione, CTA */}
        <div
          ref={settleRef}
          className="absolute inset-x-0 bottom-0 flex items-end"
          style={
            isScrub
              ? { opacity: 0, visibility: "hidden" }
              : undefined
          }
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to top, rgba(8,7,7,.93) 0%, rgba(8,7,7,.8) 42%, rgba(8,7,7,.58) 68%, rgba(8,7,7,0) 100%)",
            }}
          />
          <div className="relative mx-auto w-full max-w-[1400px] px-6 pb-8 pt-32 md:px-10 md:pb-10">
            <p className="mb-5 inline-block bg-ink/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.5em] text-white backdrop-blur-sm">
              Old River Hotel · Ristorante
            </p>
            <h1 className="tshadow max-w-[18ch] text-4xl font-light leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {isScrub ? wordsRise("Una sosta sul Po, a Guastalla.") : "Una sosta sul Po, a Guastalla."}
            </h1>
            <p
              className="tshadow mt-6 max-w-[48ch] text-lg leading-relaxed text-white"
              style={isScrub ? css({ opacity: "var(--ks,1)" }) : undefined}
            >
              Camere, ristorante e sale per chi viaggia per lavoro e per chi cerca un posto dove fermarsi.
            </p>
            <div className="mt-6" style={isScrub ? css({ opacity: "var(--kb,1)" }) : undefined}>
              <div className="hide-short">
                <BookingBar onSubmit={onSubmit} />
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button onClick={onBook} className={`${btnSolid} show-short`}>
                  Verifica disponibilità
                </button>
                <a href="#aziende" className={btnOutline}>
                  Soggiorni per aziende
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* anello di caricamento: solo mentre il video arriva */}
        {isScrub && !failed && (
          <div
            ref={ringWrapRef}
            aria-hidden="true"
            className="hide-short pointer-events-none absolute bottom-6 right-6 text-stone transition-opacity duration-700 md:right-10"
          >
            <svg viewBox="0 0 48 48" className="h-8 w-8 -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <circle
                ref={ringRef}
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="126"
                strokeDashoffset="126"
              />
            </svg>
          </div>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Sezioni sotto la piega                                              */
/* ------------------------------------------------------------------ */

function Rooms({ onRequest }: { onRequest: (room: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [idx, setIdx] = useState(0);
  const reduce = useReduced();

  const go = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const w = (card?.offsetWidth ?? 400) + 24;
    el.scrollBy({ left: dir * w, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section id="camere" className="on-light relative bg-mist py-24 text-black md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <Stars light />
        <Label light>Camere</Label>
        <Rule light />
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <h2 className="max-w-[16ch] text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
            Camere per dormire davvero.
          </h2>
          <div className="flex gap-3" role="group" aria-label="Scorri le camere">
            <button
              onClick={() => go(-1)}
              aria-label="Camera precedente"
              disabled={idx === 0}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/30 transition-colors hover:bg-black hover:text-white disabled:opacity-30"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Camera successiva"
              disabled={idx === ROOMS.length - 1}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-black/30 transition-colors hover:bg-black hover:text-white disabled:opacity-30"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          const card = el.querySelector<HTMLElement>("[data-card]");
          if (!card) return;
          setIdx(clamp(Math.round(el.scrollLeft / (card.offsetWidth + 24)), 0, ROOMS.length - 1));
        }}
        className="mt-14 flex snap-x snap-mandatory scroll-px-6 gap-6 overflow-x-auto px-6 pb-4 md:scroll-px-10 [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label="Camere"
      >
        {ROOMS.map((r, i) => (
          <motion.article
            key={r.name}
            data-card
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.9, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="w-[85vw] max-w-[560px] shrink-0 snap-start bg-white shadow-2xl shadow-black/10 md:w-[560px]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={r.img}
                alt={`${r.name}: immagine rappresentativa`}
                fill
                sizes="(max-width: 768px) 85vw, 560px"
                className="object-cover"
              />
            </div>
            <div className="p-7">
              <h3 className="text-2xl font-semibold tracking-tight">{r.name}</h3>
              <p className="mt-2 text-ink-soft">{r.line}</p>
              <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3">
                {r.feats.map((f) => (
                  <li key={f.label} className="flex items-center gap-2 text-sm text-ink-soft">
                    <f.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                    {f.label}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onRequest(r.name)}
                className="mt-8 inline-flex min-h-[44px] items-center gap-3 border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.3em] transition-opacity hover:opacity-60"
              >
                Richiedi questa camera <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </motion.article>
        ))}
      </div>
      <p className="mx-auto mt-6 max-w-[1400px] px-6 text-sm text-ink-soft md:px-10">
        Immagini rappresentative. Per le tipologie disponibili chiamaci allo {HOTEL.phone}.
      </p>
    </section>
  );
}

function Restaurant() {
  const [when, setWhen] = useState<"giorno" | "sera">("giorno");
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);
  const reduce = useReduced();

  const copy = {
    giorno: {
      title: "A tavola, senza fretta.",
      text: "La sala si apre sul giardino con grandi vetrate. Luce naturale, tavoli larghi, il tempo di parlare davvero.",
    },
    sera: {
      title: "La stessa sala, a luci basse.",
      text: "Quando fuori scende la sera il tono cambia: tavoli apparecchiati, voci più piano, una cena che non ha orologio.",
    },
  } as const;

  return (
    <section id="ristorante" ref={ref} className="relative overflow-hidden bg-ink py-24 md:py-0">
      <div className="mx-auto grid max-w-[1400px] items-center md:min-h-[88vh] md:grid-cols-2">
        <div className="px-6 md:px-10 md:py-24">
          <Stars />
          <Label>Ristorante</Label>
          <Rule />
          <AnimatePresence mode="wait">
            <motion.div
              key={when}
              initial={{ opacity: 0, y: reduce ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduce ? 0 : -12 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <h2 className="max-w-[14ch] text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
                {copy[when].title}
              </h2>
              <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-white/85">{copy[when].text}</p>
            </motion.div>
          </AnimatePresence>

          <div
            role="group"
            aria-label="Momento della giornata"
            className="mt-10 inline-flex border border-white/25"
          >
            {(
              [
                ["giorno", "Giorno", Sun],
                ["sera", "Sera", Moon],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setWhen(key)}
                aria-pressed={when === key}
                className={`inline-flex min-h-[48px] items-center gap-2 px-6 text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-500 ${
                  when === key ? "bg-white text-black" : "text-white hover:bg-white/10"
                }`}
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <p className="mt-10 flex items-start gap-3 text-white/80">
            <UtensilsCrossed size={20} strokeWidth={1.5} className="mt-1 shrink-0" aria-hidden="true" />
            <span>
              Per orari, menu e tavolo chiamaci allo{" "}
              <a className="underline underline-offset-4 hover:text-white" href={HOTEL.phoneHref}>
                {HOTEL.phone}
              </a>
              .
            </span>
          </p>
        </div>

        <div className="relative mt-14 aspect-[4/5] overflow-hidden md:mt-0 md:aspect-auto md:h-full md:min-h-[88vh]">
          <motion.div style={{ y: reduce ? 0 : y }} className="absolute -inset-y-[8%] inset-x-0">
            <AnimatePresence initial={false}>
              <motion.div
                key={when}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.1, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={when === "giorno" ? "/img/sala-giorno.jpg" : "/img/sala-sera.jpg"}
                  alt={
                    when === "giorno"
                      ? "La sala del ristorante di giorno, immagine rappresentativa"
                      : "La sala del ristorante di sera, immagine rappresentativa"
                  }
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Services() {
  return (
    <section className="on-light bg-mist py-24 text-black md:py-32" aria-labelledby="servizi-t">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <Label light>Servizi</Label>
        <Rule light />
        <h2 id="servizi-t" className="max-w-[18ch] text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
          Quello che serve, senza giri.
        </h2>
        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {SERVICES.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.8, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className={`flex min-h-[200px] flex-col justify-between border border-black/10 bg-white p-7 ${s.span}`}
            >
              <s.icon size={28} strokeWidth={1.5} aria-hidden="true" />
              <div className="mt-10">
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Business({ onRequest }: { onRequest: () => void }) {
  const items = [
    { icon: Building2, title: "Una camera pronta", text: "Arrivi dopo la riunione e trovi tutto a posto, anche tardi: la reception è sempre aperta." },
    { icon: Presentation, title: "Una sala per riunirsi", text: "La sala congressi per incontri, formazione o un piccolo evento." },
    { icon: UtensilsCrossed, title: "Una cena a fine giornata", text: "Il ristorante è nello stesso edificio. Non devi uscire a cercarlo." },
  ];
  return (
    <section id="aziende" className="relative bg-ink py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <Stars />
        <Label>Aziende</Label>
        <Rule />
        <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="max-w-[16ch] text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              La trasferta funziona quando non devi pensarci.
            </h2>
            <p className="mt-8 max-w-[48ch] text-lg leading-relaxed text-white/85">
              Orari che saltano, parcheggi da cercare, cene all&apos;ultimo minuto. A Old River trovi il
              contrario: una struttura a due passi dalla strada, parcheggio custodito e tutto sotto lo
              stesso tetto.
            </p>
            <p className="mt-6 flex items-start gap-3 text-white/70">
              <MapPin size={20} strokeWidth={1.5} className="mt-1 shrink-0" aria-hidden="true" />
              <span>Caselli A22 a circa 16 km e A1 a circa 25 km, secondo la scheda turistica ufficiale.</span>
            </p>
            <button onClick={onRequest} className={`${btnSolid} mt-10`}>
              Chiedi una proposta per la tua azienda
            </button>
          </motion.div>

          <ul className="flex flex-col gap-4">
            {items.map((it, i) => (
              <motion.li
                key={it.title}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.9, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
                className="flex gap-5 border border-white/10 bg-ink-2 p-7"
              >
                <it.icon size={28} strokeWidth={1.5} className="shrink-0 text-stone" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold">{it.title}</h3>
                  <p className="mt-1 leading-relaxed text-white/75">{it.text}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Modulo di contatto (Privato / Azienda)                              */
/* ------------------------------------------------------------------ */

type FormState = {
  nome: string;
  email: string;
  telefono: string;
  arrivo: string;
  partenza: string;
  ospiti: string;
  messaggio: string;
  ragione: string;
  persone: string;
  esigenza: string;
  consenso: boolean;
};
const EMPTY: FormState = {
  nome: "",
  email: "",
  telefono: "",
  arrivo: "",
  partenza: "",
  ospiti: "2",
  messaggio: "",
  ragione: "",
  persone: "",
  esigenza: "Trasferta",
  consenso: false,
};

function ContactForm({ prefill }: { prefill: Prefill | null }) {
  const [mode, setMode] = useState<"privato" | "azienda">("privato");
  const [f, setF] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "mailto" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  // precompilazione dalla barra di prenotazione o dalle schede camera
  const [seenNonce, setSeenNonce] = useState<number | null>(null);
  if (prefill && prefill.nonce !== seenNonce) {
    setSeenNonce(prefill.nonce);
    setMode(prefill.mode ?? "privato");
    setF((s) => ({
      ...s,
      arrivo: prefill.arrival ?? s.arrivo,
      partenza: prefill.departure ?? s.partenza,
      ospiti: prefill.guests ?? s.ospiti,
      messaggio: prefill.message ?? s.messaggio,
    }));
    setStatus("idle");
  }

  const set = (k: keyof FormState) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    const er: Record<string, string> = {};
    if (!f.nome.trim()) er.nome = "Scrivi il tuo nome.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Inserisci un'email valida.";
    if (mode === "azienda" && !f.ragione.trim()) er.ragione = "Scrivi la ragione sociale.";
    if (mode === "azienda" && !f.persone.trim()) er.persone = "Quante persone?";
    if (f.arrivo && f.partenza && f.partenza < f.arrivo) er.partenza = "La partenza è prima dell'arrivo.";
    if (!f.consenso) er.consenso = "Serve il tuo consenso per rispondere alla richiesta.";
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const bodyText = () =>
    [
      `Tipo di richiesta: ${mode === "azienda" ? "Azienda" : "Privato"}`,
      `Nome: ${f.nome}`,
      mode === "azienda" ? `Ragione sociale: ${f.ragione}` : "",
      mode === "azienda" ? `Numero persone: ${f.persone}` : "",
      mode === "azienda" ? `Esigenza: ${f.esigenza}` : "",
      `Email: ${f.email}`,
      f.telefono ? `Telefono: ${f.telefono}` : "",
      f.arrivo ? `Arrivo: ${f.arrivo}` : "",
      f.partenza ? `Partenza: ${f.partenza}` : "",
      `Ospiti: ${f.ospiti}`,
      f.messaggio ? `Messaggio: ${f.messaggio}` : "",
    ]
      .filter(Boolean)
      .join("\n");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("loading");
    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ tipo: mode, ...f, riepilogo: bodyText() }),
        });
        if (!res.ok) throw new Error("endpoint");
        setStatus("success");
        setF(EMPTY);
      } else if (HOTEL.email) {
        const subj = encodeURIComponent(`Richiesta dal sito, ${mode === "azienda" ? "azienda" : "privato"}`);
        window.location.href = `mailto:${HOTEL.email}?subject=${subj}&body=${encodeURIComponent(bodyText())}`;
        setStatus("mailto");
      } else {
        setErrMsg(
          `Il modulo non è ancora collegato a una casella email, quindi la richiesta non è partita. Chiamaci allo ${HOTEL.phone}.`
        );
        setStatus("error");
      }
    } catch {
      setErrMsg(`Non siamo riusciti a inviare la richiesta. Riprova tra un attimo o chiamaci allo ${HOTEL.phone}.`);
      setStatus("error");
    }
  };

  const input =
    "w-full border border-black/30 bg-white px-4 py-3 text-base text-black outline-none transition-colors focus:border-black";
  const lbl = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-soft";
  const err = (k: string) =>
    errors[k] ? (
      <p role="alert" className="mt-1 text-sm text-[#8a1c1c]">
        {errors[k]}
      </p>
    ) : null;

  if (status === "success" || status === "mailto") {
    return (
      <div role="status" className="border border-black/10 bg-white p-10">
        <Check size={28} strokeWidth={1.5} aria-hidden="true" />
        <h3 className="mt-4 text-2xl font-semibold">
          {status === "success" ? "Richiesta inviata." : "Quasi fatto."}
        </h3>
        <p className="mt-3 max-w-[46ch] leading-relaxed text-ink-soft">
          {status === "success"
            ? "La riceviamo direttamente in struttura e ti rispondiamo noi."
            : "Si è aperta la tua app di posta con la richiesta già scritta. La richiesta parte solo quando premi Invia da lì."}
        </p>
        <button onClick={() => setStatus("idle")} className="mt-6 border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.3em]">
          Nuova richiesta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="border border-black/10 bg-white p-6 md:p-10" aria-label="Richiesta di contatto">
      <div role="group" aria-label="Tipo di richiesta" className="mb-8 inline-flex border border-black/30">
        {(["privato", "azienda"] as const).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`min-h-[44px] px-6 text-xs font-semibold uppercase tracking-[0.3em] transition-colors duration-500 ${
              mode === m ? "bg-black text-white" : "hover:bg-black/5"
            }`}
          >
            {m === "privato" ? "Privato" : "Azienda"}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className={lbl} htmlFor="f-nome">Nome e cognome</label>
          <input id="f-nome" className={input} value={f.nome} onChange={set("nome")} autoComplete="name" />
          {err("nome")}
        </div>
        <div>
          <label className={lbl} htmlFor="f-email">Email</label>
          <input id="f-email" type="email" className={input} value={f.email} onChange={set("email")} autoComplete="email" />
          {err("email")}
        </div>
        <div>
          <label className={lbl} htmlFor="f-tel">Telefono</label>
          <input id="f-tel" type="tel" className={input} value={f.telefono} onChange={set("telefono")} autoComplete="tel" />
        </div>
        <div>
          <label className={lbl} htmlFor="f-ospiti">Ospiti</label>
          <select id="f-ospiti" className={input} value={f.ospiti} onChange={set("ospiti")}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={lbl} htmlFor="f-arrivo">Arrivo</label>
          <input id="f-arrivo" type="date" className={input} value={f.arrivo} onChange={set("arrivo")} />
        </div>
        <div>
          <label className={lbl} htmlFor="f-partenza">Partenza</label>
          <input id="f-partenza" type="date" className={input} value={f.partenza} onChange={set("partenza")} />
          {err("partenza")}
        </div>

        {mode === "azienda" && (
          <>
            <div>
              <label className={lbl} htmlFor="f-rag">Ragione sociale</label>
              <input id="f-rag" className={input} value={f.ragione} onChange={set("ragione")} autoComplete="organization" />
              {err("ragione")}
            </div>
            <div>
              <label className={lbl} htmlFor="f-pers">Numero di persone</label>
              <input id="f-pers" inputMode="numeric" className={input} value={f.persone} onChange={set("persone")} />
              {err("persone")}
            </div>
            <div className="md:col-span-2">
              <label className={lbl} htmlFor="f-esi">Di cosa hai bisogno</label>
              <select id="f-esi" className={input} value={f.esigenza} onChange={set("esigenza")}>
                <option>Trasferta</option>
                <option>Convenzione</option>
                <option>Evento o riunione</option>
                <option>Gruppo</option>
              </select>
            </div>
          </>
        )}

        <div className="md:col-span-2">
          <label className={lbl} htmlFor="f-msg">Messaggio</label>
          <textarea id="f-msg" rows={4} className={input} value={f.messaggio} onChange={set("messaggio")} />
        </div>
      </div>

      <div className="mt-6">
        <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={f.consenso}
            onChange={(e) => setF((s) => ({ ...s, consenso: e.target.checked }))}
            className="mt-1 h-5 w-5 accent-black"
          />
          <span>
            Acconsento al trattamento dei miei dati per ricevere una risposta a questa richiesta.
            L&apos;informativa privacy completa è in arrivo con i dati del titolare.
          </span>
        </label>
        {err("consenso")}
      </div>

      {status === "error" && (
        <p role="alert" className="mt-6 border border-[#8a1c1c]/40 bg-[#8a1c1c]/5 p-4 text-sm text-[#6e1414]">
          {errMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className={`${btnBase} mt-8 w-full bg-black text-white hover:bg-ink-soft disabled:opacity-60 md:w-auto`}
      >
        {status === "loading" ? (
          <>
            <Loader2 size={18} strokeWidth={1.5} className="animate-spin" aria-hidden="true" /> Invio
          </>
        ) : (
          "Invia la richiesta"
        )}
      </button>
    </form>
  );
}

function Contact({ prefill }: { prefill: Prefill | null }) {
  return (
    <section id="contatti" className="on-light bg-mist py-24 text-black md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <Stars light />
        <Label light>Contatti</Label>
        <Rule light />
        <div className="grid gap-14 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="max-w-[16ch] text-4xl font-light leading-[1.05] tracking-tight sm:text-6xl">
              Scrivici, ti rispondiamo noi.
            </h2>
            <p className="mb-10 mt-6 max-w-[46ch] text-lg leading-relaxed text-ink-soft">
              Date, numero di ospiti e due righe su cosa ti serve. Il resto lo sistemiamo insieme.
            </p>
            <ContactForm prefill={prefill} />
          </div>

          <aside id="dove" aria-label="Dove siamo" className="lg:pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.5em] text-ink-soft">Dove siamo</h3>
            <address className="mt-6 not-italic">
              <p className="text-2xl font-light leading-snug">
                Viale Po 2
                <br />
                42016 Guastalla (RE)
              </p>
            </address>
            <ul className="mt-8 space-y-4">
              <li>
                <a href={HOTEL.phoneHref} className="inline-flex min-h-[44px] items-center gap-3 text-lg hover:underline">
                  <Phone size={20} strokeWidth={1.5} aria-hidden="true" /> {HOTEL.phone}
                </a>
              </li>
              <li>
                <a
                  href={HOTEL.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-3 text-lg hover:underline"
                >
                  <MapPin size={20} strokeWidth={1.5} aria-hidden="true" /> Apri su Google Maps
                </a>
              </li>
              <li className="flex items-start gap-3 pt-2 text-ink-soft">
                <CalendarDays size={20} strokeWidth={1.5} className="mt-1 shrink-0" aria-hidden="true" />
                Aperti tutto l&apos;anno, chiusi il 25 dicembre.
              </li>
              <li className="flex items-start gap-3 text-ink-soft">
                <Car size={20} strokeWidth={1.5} className="mt-1 shrink-0" aria-hidden="true" />
                Dalla A22 circa 16 km, dalla A1 circa 25 km.
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-ink px-6 pb-12 pt-24 text-center md:px-10">
      <div aria-hidden="true" className="mx-auto mb-14 h-px max-w-[1400px] bg-stone/40" />
      <Image
        src="/img/logo-negative.png"
        alt="Old River Hotel"
        width={1500}
        height={900}
        className="mx-auto h-auto w-[260px] md:w-[360px]"
      />
      <address className="mt-12 not-italic text-white/80">
        <p>{HOTEL.address}</p>
        <p className="mt-2">
          <a className="hover:text-white" href={HOTEL.phoneHref}>
            {HOTEL.phone}
          </a>
          {HOTEL.email && (
            <>
              {" · "}
              <a className="hover:text-white" href={`mailto:${HOTEL.email}`}>
                {HOTEL.email}
              </a>
            </>
          )}
        </p>
      </address>
      {HOTEL.social.length > 0 && (
        <ul className="mt-6 flex justify-center gap-6">
          {HOTEL.social.map((s) => (
            <li key={s.href}>
              <a href={s.href} className="text-white/80 hover:text-white" rel="noopener noreferrer">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="mx-auto mt-10 max-w-[60ch] text-xs leading-relaxed text-white/60">
        {HOTEL.piva ? `P.IVA ${HOTEL.piva}. ` : ""}
        Le immagini di camere e sala sono rappresentative. Informativa privacy e cookie in arrivo con i dati del titolare.
      </p>
    </footer>
  );
}

/** Linea sinuosa che evoca il corso del Po: si traccia con lo scroll. */
function PoLine() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 30%"] });
  const reduce = useReduced();
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] hidden md:block">
      <svg viewBox="0 0 100 1000" preserveAspectRatio="none" className="h-full w-full">
        <motion.path
          d="M 2 0 C 3 90, 1 140, 2.6 230 S 1.2 380, 3 470 S 1 570, 2.6 660 S 1.4 770, 3 860 S 1.2 950, 2 1000"
          fill="none"
          stroke="rgba(211,206,206,0.55)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: reduce ? 1 : scrollYProgress }}
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pagina                                                              */
/* ------------------------------------------------------------------ */

export default function Home() {
  const mode = useHeroMode();
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [stickyOn, setStickyOn] = useState(false);
  const [contactVisible, setContactVisible] = useState(false);

  const toContact = useCallback((p?: Partial<Prefill>) => {
    if (p) setPrefill({ nonce: Date.now(), ...p });
    document.getElementById("contatti")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const on = () => setStickyOn(window.scrollY > window.innerHeight * 0.9);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const el = document.getElementById("contatti");
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setContactVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] bg-white px-4 py-3 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Vai al contenuto
      </a>
      <Header onBook={() => toContact()} />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero mode={mode} onSubmit={(p) => toContact(p)} onBook={() => toContact()} />
        <div className="relative">
          <PoLine />
          <Rooms
            onRequest={(room) =>
              toContact({ message: `Vorrei informazioni su: ${room}.`, mode: "privato" })
            }
          />
          <Restaurant />
          <Services />
          <Business onRequest={() => toContact({ mode: "azienda" })} />
          <Contact prefill={prefill} />
        </div>
      </main>
      <Footer />

      {/* prenotazione compatta sticky su mobile */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-ink/90 p-3 backdrop-blur-md transition-transform duration-500 md:hidden ${
          stickyOn && !contactVisible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <button onClick={() => toContact()} className={`${btnSolid} w-full`}>
          Verifica disponibilità
        </button>
      </div>
    </>
  );
}
