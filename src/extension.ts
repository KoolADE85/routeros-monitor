import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { RouterMonitor } from "./backend/index.js";
import type { InterfaceStatus } from "./backend/types.js";
import { UIStatusPresenter } from "./ui/index.js";

export default class MikroTikExtension extends Extension {
  private _routerMonitor: RouterMonitor | null = null;
  private _ui: UIStatusPresenter | null = null;

  enable(): void {
    const settings = this.getSettings();

    const routerMonitor = new RouterMonitor(settings);
    this._routerMonitor = routerMonitor;
    routerMonitor.start();

    this._createPresenter(routerMonitor);

    routerMonitor.connectObject(
      "router-update",
      (_src: RouterMonitor, data: InterfaceStatus) =>
        this._ui?.showStatus(data),
      "router-error",
      (_src: RouterMonitor, err: Error) => this._ui?.handleError(err),
      this,
    );

    settings.connectObject(
      "changed::display-mode",
      () => this._createPresenter(routerMonitor),
      this,
    );
  }

  disable(): void {
    this.getSettings().disconnectObject(this);
    this._ui?.disconnectObject(this);
    this._ui?.destroy();
    this._ui = null;
    this._routerMonitor?.disconnectObject(this);
    this._routerMonitor?.destroy();
    this._routerMonitor = null;
  }

  private _createPresenter(routerMonitor: RouterMonitor): void {
    this._ui?.disconnectObject(this);
    this._ui?.destroy();
    const uiMode = this.getSettings().get_string("display-mode");
    this._ui = new UIStatusPresenter(uiMode);
    this._ui.connectObject(
      "refresh-requested",
      () => routerMonitor.refresh(),
      this,
    );
  }
}
