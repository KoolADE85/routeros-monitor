import Gio from "gi://Gio";

import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import { InterfaceType, type InterfaceStatus } from "../../backend/types.js";

export class StatusIcon {
  private _extensionPath: string;
  private _useGnomeIcons: boolean;
  private _settings: Gio.Settings;
  private _settingsId: number;
  private _status: InterfaceStatus | null = null;

  constructor() {
    const extension = Extension.lookupByURL(import.meta.url);
    if (!extension) throw new Error("Extension not found");
    this._extensionPath = extension.path;
    const settings = extension.getSettings();
    this._settings = settings;
    this._useGnomeIcons = settings.get_boolean("use-gnome-icons");
    this._settingsId = settings.connect("changed::use-gnome-icons", () => {
      this._useGnomeIcons = settings.get_boolean("use-gnome-icons");
    });
  }

  destroy(): void {
    this._settings.disconnect(this._settingsId);
  }

  setStatus(data: InterfaceStatus): void {
    this._status = data;
  }

  getIcon(): Gio.Icon {
    return this._resolve(this._iconName());
  }

  getIconDegraded(): Gio.Icon {
    const base = this._resolve(this._iconName());
    const emblem = new Gio.Emblem({
      icon: Gio.ThemedIcon.new("emblem-urgent"),
    });
    const emblemedIcon = new Gio.EmblemedIcon({ gicon: base });
    emblemedIcon.add_emblem(emblem);
    return emblemedIcon;
  }

  getIconErrored(): Gio.Icon {
    return this._resolve("dialog-warning");
  }

  private _iconName(): string {
    if (!this._status) return "network-offline";
    switch (this._status.type) {
      case InterfaceType.Lte: {
        const pct = this._status.qualityPct ?? 0;
        let level: string;
        if (pct >= 80) level = "excellent";
        else if (pct >= 55) level = "good";
        else if (pct >= 30) level = "ok";
        else if (pct >= 10) level = "weak";
        else level = "none";
        return `network-cellular-signal-${level}`;
      }
      case InterfaceType.Ether:
        return "network-wired";
    }
  }

  private _resolve(iconName: string): Gio.Icon {
    if (!this._useGnomeIcons) {
      const file = Gio.File.new_for_path(
        `${this._extensionPath}/icons/hicolor/scalable/status/${iconName}.svg`,
      );
      if (file.query_exists(null)) return new Gio.FileIcon({ file });
    }
    return Gio.ThemedIcon.new(`${iconName}-symbolic`);
  }
}
