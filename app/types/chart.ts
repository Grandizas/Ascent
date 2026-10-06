/** A row under a day chart marking entries that carry one tag (e.g. cravings). */
export interface ChartLane {
  tag: string
  /** Lane title, e.g. "Cravings". */
  label: string
  /** Marker tooltip prefix, e.g. "Craving". */
  itemLabel: string
}
