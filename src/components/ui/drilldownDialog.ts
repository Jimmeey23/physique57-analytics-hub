/**
 * One sizing + surface contract for every drill-down modal in the app.
 *
 * Drill-downs used to each pick their own width (max-w-4xl, 7xl, 95vw, ...),
 * and none of them actually applied because the base DialogContent carried a
 * `sm:max-w-lg` that tailwind-merge could not override. Import these instead of
 * hand-rolling widths so all drill-downs open at the same size and share the
 * same rounded, bordered, scroll-contained shell.
 */

/** Apply to <DialogContent> when the modal manages its own scroll region. */
export const DRILLDOWN_CONTENT_CLASS =
  'flex h-[82vh] max-h-[82vh] w-[92vw] max-w-[92vw] flex-col gap-0 overflow-hidden rounded-[26px] border border-slate-200 bg-white p-0 shadow-[0_28px_90px_rgba(15,23,42,0.18)] xl:w-[88vw] xl:max-w-[1530px]';

/**
 * Apply to <DialogContent> when the modal expects the dialog surface itself to
 * scroll (no internal scroll container of its own).
 */
export const DRILLDOWN_SCROLL_CONTENT_CLASS =
  'block h-[82vh] max-h-[82vh] w-[92vw] max-w-[92vw] overflow-y-auto overscroll-contain rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_28px_90px_rgba(15,23,42,0.18)] sm:p-6 xl:w-[88vw] xl:max-w-[1530px]';

/** Sticky modal header band. */
export const DRILLDOWN_HEADER_CLASS = [
  'shrink-0 space-y-2 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950',
  'px-4 py-4 text-left text-white sm:px-6 sm:py-5 lg:px-8',
  // Drill-downs arrived with light and dark headers; these force one contrast
  // model so a modal written for a white band still reads on the dark one.
  '[&_h2]:text-white [&_h3]:text-white [&_p]:text-slate-300 [&_svg]:text-slate-200',
  '[&_code]:bg-white/10 [&_code]:text-slate-100',
].join(' ');

/** Scrollable body region under the header. */
export const DRILLDOWN_BODY_CLASS =
  'min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6';

/** Responsive KPI tile row used at the top of a drill-down body. */
export const DRILLDOWN_TILE_GRID_CLASS =
  'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6';

/** A single KPI tile: min-w-0 so long values truncate instead of overlapping. */
export const DRILLDOWN_TILE_CLASS =
  'min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-3 sm:px-4';

/** Table viewport inside a drill-down. */
export const DRILLDOWN_TABLE_VIEWPORT_CLASS =
  'max-h-[46vh] overflow-auto min-[900px]:max-h-[50vh]';
