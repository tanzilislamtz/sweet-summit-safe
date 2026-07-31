import type { FigureSpec } from "@/data/figures";
import { cn } from "@/lib/utils";

export interface QuestionFigureProps extends React.ComponentProps<"figure"> {
  spec: FigureSpec;
  /** Compact variant for print/paper previews. */
  compact?: boolean;
}

/**
 * Renders a question figure. If the admin panel supplied an uploaded image it
 * is shown; otherwise a deterministic inline SVG diagram is drawn so every
 * figure-based question stays readable offline and in dark mode.
 */
export function QuestionFigure({ spec, compact, className, ...rest }: QuestionFigureProps) {
  const h = compact ? 120 : 168;

  return (
    <figure
      {...rest}
      className={cn(
        "mt-3 overflow-hidden rounded-2xl border border-border bg-muted/40",
        className,
      )}
    >
      {spec.imageUrl ? (
        <img
          src={spec.imageUrl}
          alt={spec.caption}
          loading="lazy"
          className="w-full object-contain"
          style={{ maxHeight: h + 40 }}
        />
      ) : (
        <div className="grid place-items-center px-3 py-3">
          <Drawing spec={spec} height={h} />
        </div>
      )}
      <figcaption className="border-t border-border bg-surface px-3 py-1.5 text-center text-[11px] text-muted-foreground">
        {spec.caption}
      </figcaption>
    </figure>
  );
}

/* ---------------------------------------------------------------- drawings */

function Drawing({ spec, height }: { spec: FigureSpec; height: number }) {
  const common = {
    height,
    viewBox: "0 0 280 160",
    className: "max-w-full",
    role: "img",
    "aria-label": spec.caption,
  } as const;
  const L = (i: number, fallback: string) => spec.labels?.[i] ?? fallback;
  const stroke = "stroke-primary";
  const text = "fill-foreground text-[11px]";

  switch (spec.kind) {
    case "triangle":
      return (
        <svg {...common}>
          <polygon
            points="40,130 240,130 90,30"
            fill="none"
            strokeWidth={2.5}
            className={stroke}
          />
          <path d="M40 118 h12 v12" fill="none" strokeWidth={1.5} className="stroke-secondary" />
          <text x="30" y="146" className={text}>{L(0, "A")}</text>
          <text x="240" y="146" className={text}>{L(1, "B")}</text>
          <text x="86" y="22" className={text}>{L(2, "C")}</text>
          <text x="130" y="146" className="fill-muted-foreground text-[11px]">{L(3, "b = 10 cm")}</text>
          <text x="30" y="80" className="fill-muted-foreground text-[11px]">{L(4, "h = 8 cm")}</text>
        </svg>
      );

    case "circuit":
      return (
        <svg {...common}>
          <rect x="30" y="30" width="220" height="100" rx="6" fill="none" strokeWidth={2.5} className={stroke} />
          {/* battery */}
          <line x1="120" y1="24" x2="120" y2="36" strokeWidth={3} className="stroke-foreground" />
          <line x1="134" y1="18" x2="134" y2="42" strokeWidth={3} className="stroke-foreground" />
          <rect x="112" y="24" width="30" height="12" fill="none" className="stroke-transparent" />
          <text x="150" y="24" className={text}>{L(0, "V = 12 V")}</text>
          {/* resistors */}
          <rect x="220" y="60" width="60" height="0" />
          <rect x="230" y="62" width="40" height="18" transform="translate(-15,0)" fill="none" strokeWidth={2.5} className="stroke-secondary" />
          <text x="150" y="146" className={text}>{L(1, "R₁ = 4 Ω")}</text>
          <rect x="80" y="122" width="46" height="16" fill="none" strokeWidth={2.5} className="stroke-secondary" />
          <text x="24" y="146" className={text}>{L(2, "R₂ = 6 Ω")}</text>
        </svg>
      );

    case "graph": {
      const vals = spec.values?.length ? spec.values : [0, 10, 25, 45, 70, 100];
      const max = Math.max(...vals, 1);
      const pts = vals
        .map((v, i) => `${30 + (i * 220) / (vals.length - 1)},${130 - (v / max) * 100}`)
        .join(" ");
      return (
        <svg {...common}>
          <line x1="30" y1="130" x2="260" y2="130" strokeWidth={2} className="stroke-border" />
          <line x1="30" y1="20" x2="30" y2="130" strokeWidth={2} className="stroke-border" />
          <polyline points={pts} fill="none" strokeWidth={2.5} strokeLinejoin="round" className={stroke} />
          {vals.map((v, i) => (
            <circle
              key={i}
              cx={30 + (i * 220) / (vals.length - 1)}
              cy={130 - (v / max) * 100}
              r={3}
              className="fill-secondary"
            />
          ))}
          <text x="230" y="148" className="fill-muted-foreground text-[11px]">{L(0, "time (s)")}</text>
          <text x="4" y="18" className="fill-muted-foreground text-[11px]">{L(1, "v")}</text>
        </svg>
      );
    }

    case "lens":
      return (
        <svg {...common}>
          <line x1="10" y1="80" x2="270" y2="80" strokeWidth={1.5} strokeDasharray="4 4" className="stroke-border" />
          <ellipse cx="140" cy="80" rx="16" ry="54" fill="none" strokeWidth={2.5} className={stroke} />
          <line x1="60" y1="80" x2="60" y2="40" strokeWidth={2.5} className="stroke-secondary" />
          <polygon points="60,36 56,46 64,46" className="fill-secondary" />
          <line x1="60" y1="40" x2="220" y2="118" strokeWidth={1.5} className="stroke-muted-foreground" />
          <text x="46" y="32" className={text}>{L(0, "object")}</text>
          <text x="200" y="136" className={text}>{L(1, "image")}</text>
          <text x="128" y="150" className="fill-muted-foreground text-[11px]">{L(2, "f = 10 cm")}</text>
        </svg>
      );

    case "beaker":
      return (
        <svg {...common}>
          <path d="M95 25 v85 a35 22 0 0 0 70 0 V25" fill="none" strokeWidth={2.5} className={stroke} />
          <path d="M95 70 a35 22 0 0 0 70 0 v40 a35 22 0 0 1 -70 0 z" className="fill-secondary/30" />
          <line x1="88" y1="25" x2="172" y2="25" strokeWidth={2.5} className={stroke} />
          <text x="180" y="70" className={text}>{L(0, "0.1 M HCl")}</text>
          <text x="180" y="94" className="fill-muted-foreground text-[11px]">{L(1, "25 mL")}</text>
        </svg>
      );

    case "barchart": {
      const vals = spec.values?.length ? spec.values : [40, 65, 30, 80];
      const max = Math.max(...vals, 1);
      return (
        <svg {...common}>
          <line x1="30" y1="130" x2="260" y2="130" strokeWidth={2} className="stroke-border" />
          {vals.map((v, i) => {
            const w = 200 / vals.length - 12;
            const x = 40 + i * (200 / vals.length);
            const bh = (v / max) * 96;
            return (
              <g key={i}>
                <rect x={x} y={130 - bh} width={w} height={bh} rx={4} className="fill-primary/80" />
                <text x={x + w / 2} y={146} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                  {L(i, String.fromCharCode(65 + i))}
                </text>
              </g>
            );
          })}
        </svg>
      );
    }

    case "cell":
    default:
      return (
        <svg {...common}>
          <ellipse cx="140" cy="80" rx="105" ry="58" fill="none" strokeWidth={2.5} className={stroke} />
          <circle cx="120" cy="76" r="24" className="fill-secondary/30 stroke-secondary" strokeWidth={2} />
          <circle cx="120" cy="76" r="7" className="fill-secondary" />
          <ellipse cx="196" cy="100" rx="20" ry="10" fill="none" strokeWidth={2} className="stroke-muted-foreground" />
          <text x="96" y="44" className={text}>{L(0, "nucleus")}</text>
          <text x="176" y="126" className={text}>{L(1, "mitochondria")}</text>
        </svg>
      );
  }
}
