import GObject from "gi://GObject";

import { NoInternetError } from "../backend/index.js";
import type { InterfaceStatus } from "../backend/types.js";
import { StatusIcon } from "./components/index.js";
import { PanelIndicator, QuickSettingsIndicator } from "./views/index.js";
import type { UIAdapter } from "./types.js";

export type UIStatusPresenter = InstanceType<typeof UIStatusPresenter>;
export const UIStatusPresenter = GObject.registerClass(
  {
    Signals: {
      "refresh-requested": {},
    },
  },
  class UIStatusPresenter extends GObject.Object {
    private _ui!: UIAdapter;
    private _icons!: StatusIcon;
    private _hasConnected = false;

    constructor(mode: string) {
      super();

      this._icons = new StatusIcon();

      if (mode === "quick-settings") {
        this._ui = new QuickSettingsIndicator();
      } else {
        this._ui = new PanelIndicator(mode);
      }

      this._ui.connectObject(
        "refresh-requested",
        () => this.emit("refresh-requested"),
        this,
      );
    }

    showStatus(status: InterfaceStatus): void {
      this._hasConnected = true;
      this._icons.setStatus(status);
      this._ui.hideBanner();
      this._ui.showStatus(status);
      this._ui.setIcon(this._icons.getIcon());
      this._ui.setVisible(true);
    }

    handleError(err: Error): void {
      if (err instanceof NoInternetError && this._hasConnected) {
        this._ui.showBanner(err.message);
        this._ui.setIcon(this._icons.getIconDegraded());
        console.warn(`[router-monitor] ${err.message}`);
      } else {
        this._hasConnected = false;
        this._ui.showError(err.message);
        this._ui.setIcon(this._icons.getIconErrored());
        this._ui.setVisible(false);
        console.error(`[router-monitor] ${err.message}`);
      }
    }

    destroy(): void {
      this._ui.disconnectObject(this);
      this._icons.destroy();
      this._ui.shutdown();
    }
  },
);
