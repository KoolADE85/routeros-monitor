import Gio from "gi://Gio";
import GObject from "gi://GObject";

import type { InterfaceStatus } from "../backend/types.js";

export interface UIAdapter extends GObject.Object {
  showStatus(status: InterfaceStatus): void;
  showBanner(message: string): void;
  hideBanner(): void;
  showError(error: string): void;
  setIcon(icon: Gio.Icon): void;
  setVisible(visible: boolean): void;
  shutdown(): void;
}
