import Clutter from "gi://Clutter";
import GObject from "gi://GObject";
import St from "gi://St";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import type { Metric } from "../../backend/types.js";

const BAR_MAX_HEIGHT = 16;
const BAR_WIDTH = 3;
const BAR_GAP = 1;
const HISTORY_LENGTH = 20;

function barColour(pct: number): string {
  if (pct >= 75) return "#33d17a";
  if (pct >= 50) return "#f6d32d";
  if (pct >= 25) return "#ff7800";
  return "#e01b24";
}

export interface MetricHandle {
  item: PopupMenu.PopupBaseMenuItem;
  update(metric: Metric): void;
}

class MetricsChart extends PopupMenu.PopupBaseMenuItem {
  private _label!: St.Label;
  private _bars!: St.Widget[];
  private _history: (number | null)[] = [];

  constructor() {
    super({ reactive: false });

    this._label = new St.Label({ x_expand: true });
    const chart = new St.BoxLayout({
      y_align: Clutter.ActorAlign.END,
      style: `spacing: ${BAR_GAP}px;`,
    });
    this._bars = Array.from({ length: HISTORY_LENGTH }, () => {
      const bar = new St.Widget({
        width: BAR_WIDTH,
        height: BAR_MAX_HEIGHT,
        y_align: Clutter.ActorAlign.END,
        style: "background-color: transparent;",
      });
      chart.add_child(bar);
      return bar;
    });
    this.add_child(this._label);
    this.add_child(chart);
  }

  update(metric: Metric): void {
    this._label.set_text(`${metric.label}:  ${metric.value}`);
    this._history.push(metric.pct ?? null);
    if (this._history.length > HISTORY_LENGTH) this._history.shift();

    for (let i = 0; i < HISTORY_LENGTH; i++) {
      const idx = i - (HISTORY_LENGTH - this._history.length);
      const val = idx >= 0 ? this._history[idx] : null;
      if (val === null) {
        this._bars[i].height = BAR_MAX_HEIGHT;
        this._bars[i].set_style("background-color: transparent;");
      } else {
        this._bars[i].height = Math.max(
          1,
          Math.round((val / 100) * BAR_MAX_HEIGHT),
        );
        this._bars[i].set_style(
          `background-color: ${barColour(val)}; border-radius: 1px;`,
        );
      }
    }
  }
}

export type MetricsChartRegistered = InstanceType<typeof MetricsChart>;
export const MetricsChartRegistered = GObject.registerClass(MetricsChart);
