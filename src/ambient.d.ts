import "@girs/gjs";
import "@girs/gjs/dom";
import "@girs/gnome-shell/ambient";
import "@girs/gnome-shell/extensions/global";
import "@girs/soup-3.0";

// @girs types addExternalIndicator(indicator: Button) but it also accepts SystemIndicator.
declare module "resource:///org/gnome/shell/ui/panel.js" {
  import type { SystemIndicator } from "resource:///org/gnome/shell/ui/quickSettings.js";
  interface QuickSettings {
    addExternalIndicator(indicator: SystemIndicator, colSpan?: number): void;
  }
}
