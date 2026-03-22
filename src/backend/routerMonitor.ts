import Gio from "gi://Gio";
import GLib from "gi://GLib";
import GObject from "gi://GObject";

import { RouterOsApi, type RouterOsConfig } from "./api.js";
import { detectInternetInterface } from "./detect.js";
import { lookupPassword } from "./keyring.js";
import { queryEthernetStatus } from "./interfaces/ethernet.js";
import { queryLteStatus } from "./interfaces/lte.js";
import {
  InterfaceType,
  toInterfaceType,
  type InterfaceStatus,
} from "./types.js";

export interface RouterMonitor extends InstanceType<typeof RouterMonitor> {
  connect(
    signal: "router-update",
    cb: (src: this, data: InterfaceStatus) => void,
  ): number;
  connect(signal: "router-error", cb: (src: this, err: Error) => void): number;
}
export const RouterMonitor = GObject.registerClass(
  {
    Signals: {
      "router-update": { param_types: [GObject.TYPE_JSOBJECT] },
      "router-error": { param_types: [GObject.TYPE_JSOBJECT] },
    },
  },
  class RouterMonitor extends GObject.Object {
    private _settings!: Gio.Settings;
    private _settingsId!: number;
    private _api!: RouterOsApi;
    private _cancellable!: Gio.Cancellable;
    private _pollTimer: number | null = null;

    constructor(settings: Gio.Settings) {
      super();
      this._settings = settings;
      this._api = new RouterOsApi(this._readConfig());
      this._cancellable = new Gio.Cancellable();

      this._settingsId = settings.connect("changed", (_s, key) => {
        if (key === "display-mode" || key === "use-default-icons") return;
        this._api.configure(this._readConfig());
        this._reset();
      });
    }

    start(): void {
      void this._doPoll();
      this._pollTimer = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        this._settings.get_int("poll-interval"),
        () => {
          void this._doPoll();
          return GLib.SOURCE_CONTINUE;
        },
      );
    }

    refresh(): void {
      void this._doPoll();
    }

    destroy(): void {
      this._settings.disconnect(this._settingsId);
      this._cancellable.cancel();
      if (this._pollTimer !== null) {
        GLib.source_remove(this._pollTimer);
        this._pollTimer = null;
      }
      this._api.destroy();
    }

    private _reset(): void {
      this._cancellable.cancel();
      this._cancellable = new Gio.Cancellable();
      void this._doPoll();
    }

    private _readConfig(): RouterOsConfig {
      const { password } = lookupPassword(this._settings);
      return {
        host: this._settings.get_string("router-host"),
        port: this._settings.get_int("router-port"),
        user: this._settings.get_string("router-user"),
        password,
        useHttps: this._settings.get_boolean("use-https"),
      };
    }

    private async _doPoll(): Promise<void> {
      try {
        const data = await this._poll(this._cancellable);
        this.emit("router-update", data);
      } catch (e: unknown) {
        const err = e as GLib.Error;
        if (err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) return;
        this.emit("router-error", e as Error);
      }
    }

    private async _poll(
      cancellable: Gio.Cancellable,
    ): Promise<InterfaceStatus> {
      const autoDetect = this._settings.get_boolean("auto-detect");

      let ifaceName: string;
      let ifaceType: InterfaceType;

      if (autoDetect) {
        const detected = await detectInternetInterface(this._api, cancellable);
        ifaceName = detected.name;
        ifaceType = detected.type;
      } else {
        ifaceName = this._settings.get_string("interface-name");
        ifaceType = toInterfaceType(
          this._settings.get_string("interface-type"),
        );
      }

      switch (ifaceType) {
        case InterfaceType.Lte:
          return queryLteStatus(this._api, ifaceName, cancellable);
        case InterfaceType.Ether:
          return queryEthernetStatus(this._api, ifaceName, cancellable);
      }
    }
  },
);
