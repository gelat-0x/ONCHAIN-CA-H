import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

let registered = false;

/** Register Chart.js scales/plugins once for all time-series charts. */
export function ensureTimeSeriesChartRegistered() {
  if (registered) return;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    TimeScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
  );
  registered = true;
}

export type ChartPoint = { ts: number; value: number };

export type ChartSeries = {
  id: string;
  label: string;
  color: string;
  data: ChartPoint[];
  fill?: boolean;
};

/** Downsample to at most `maxPoints` while keeping first & last. */
export function downsampleSeries(points: ChartPoint[], maxPoints: number): ChartPoint[] {
  if (points.length <= maxPoints) return points;
  const out: ChartPoint[] = [];
  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    out.push(points[idx]!);
  }
  return out;
}

/** Merge compare token history onto primary timestamps (nearest match). */
export function alignSeries(primary: ChartPoint[], secondary: ChartPoint[]): ChartPoint[] {
  if (!secondary.length) return [];
  return primary.map((p) => {
    let best = secondary[0]!;
    let bestDiff = Math.abs(best.ts - p.ts);
    for (const s of secondary) {
      const d = Math.abs(s.ts - p.ts);
      if (d < bestDiff) {
        best = s;
        bestDiff = d;
      }
    }
    return { ts: p.ts, value: best.value };
  });
}
