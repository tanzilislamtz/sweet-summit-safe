/**
 * Figure specifications attached to questions.
 *
 * Real question banks will ship uploaded images from the admin panel. Until
 * then a figure is described declaratively and rendered as inline SVG, so a
 * question can genuinely ask "look at the figure and answer".
 */
export type FigureKind =
  | "triangle"
  | "circuit"
  | "graph"
  | "lens"
  | "beaker"
  | "barchart"
  | "cell";

export type FigureSpec = {
  kind: FigureKind;
  caption: string;
  /** Short labels drawn inside the figure (meaning depends on `kind`). */
  labels?: string[];
  /** Numeric series used by data-driven figures (graph / barchart). */
  values?: number[];
  /** Optional uploaded image URL — takes priority over the drawn shape. */
  imageUrl?: string;
};
