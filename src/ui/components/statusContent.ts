import St from "gi://St";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

import type { InterfaceStatus, Metric } from "../../backend/types.js";
import {
  MetricsChartRegistered as MetricsChart,
  type MetricHandle,
} from "./metricsChart.js";

export class StatusContent extends PopupMenu.PopupMenuSection {
  private _headlineItem!: PopupMenu.PopupMenuItem;
  private _secondaryItem!: PopupMenu.PopupMenuItem;
  private _expanded = false;
  private _metricHandles!: MetricHandle[];

  constructor(data: InterfaceStatus) {
    super();

    this._headlineItem = new PopupMenu.PopupMenuItem("");
    const caret = new St.Icon({
      icon_name: "pan-end-symbolic",
      style_class: "popup-menu-arrow",
    });
    this._headlineItem.add_child(caret);
    this.addMenuItem(this._headlineItem);

    this._secondaryItem = new PopupMenu.PopupMenuItem("", {
      reactive: false,
    });
    this.addMenuItem(this._secondaryItem);

    const sep = new PopupMenu.PopupSeparatorMenuItem();
    this.addMenuItem(sep);

    this._metricHandles = data.metrics.map((m) => {
      if (m.pct !== undefined) {
        const chart = new MetricsChart();
        this.addMenuItem(chart);
        return {
          item: chart,
          update: (metric: Metric) => chart.update(metric),
        };
      }
      const item = new PopupMenu.PopupMenuItem("", { reactive: false });
      this.addMenuItem(item);
      return {
        item,
        update: (metric: Metric) =>
          item.label.set_text(`${metric.label}: ${metric.value}`),
      };
    });

    const detailItems = [
      this._secondaryItem,
      sep,
      ...this._metricHandles.map((h) => h.item),
    ];

    this._headlineItem.activate = () => {
      this._expanded = !this._expanded;
      detailItems.forEach((i) => (i.visible = this._expanded));
      caret.icon_name = this._expanded
        ? "pan-down-symbolic"
        : "pan-end-symbolic";
    };

    this.update(data);
  }

  update(data: InterfaceStatus): void {
    this._headlineItem.label.set_text(data.headline);
    this._secondaryItem.label.set_text(data.secondaryInfo ?? "");
    this._secondaryItem.visible = this._expanded && !!data.secondaryInfo;

    for (
      let i = 0;
      i < this._metricHandles.length && i < data.metrics.length;
      i++
    ) {
      this._metricHandles[i].update(data.metrics[i]);
    }
  }
}
