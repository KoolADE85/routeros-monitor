import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import type { InterfaceStatus } from "../../backend/types.js";
import { ErrorContent, StatusContent } from "../components/index.js";
import type { UIAdapter } from "../types.js";

type PanelBox = "left" | "center" | "right";

const BOX_MAP: Record<string, PanelBox> = {
  "panel-left": "left",
  "panel-center": "center",
  "panel-right": "right",
};

class PanelIndicator extends PanelMenu.Button implements UIAdapter {
  private _icon!: St.Icon;
  private _bannerSection!: PopupMenu.PopupMenuSection;
  private _section!: PopupMenu.PopupMenuSection;
  private _refreshItem!: PopupMenu.PopupMenuItem;
  private _content: StatusContent | null = null;
  private _errorContent: ErrorContent | null = null;
  private _banner: PopupMenu.PopupBaseMenuItem | null = null;

  constructor(displayMode: string) {
    super(0.0, "RouterOS Monitor");

    this._icon = new St.Icon({
      icon_name: "network-cellular-signal-none-symbolic",
      style_class: "system-status-icon",
    });
    this.add_child(this._icon);

    const menu = this.menu as PopupMenu.PopupMenu;

    this._bannerSection = new PopupMenu.PopupMenuSection();
    menu.addMenuItem(this._bannerSection);

    this._section = new PopupMenu.PopupMenuSection();
    menu.addMenuItem(this._section);

    menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    this._refreshItem = new PopupMenu.PopupMenuItem("Refresh Now");
    this._refreshItem.activate = () => this.emit("refresh-requested");
    menu.addMenuItem(this._refreshItem);

    const prefsItem = new PopupMenu.PopupMenuItem("Preferences");
    prefsItem.connect("activate", () => {
      Extension.lookupByURL(import.meta.url)?.openPreferences();
    });
    menu.addMenuItem(prefsItem);

    const extension = Extension.lookupByURL(import.meta.url);
    const box = BOX_MAP[displayMode] ?? "right";
    Main.panel.addToStatusArea(extension?.uuid ?? "", this, -1, box);
  }

  showStatus(status: InterfaceStatus): void {
    if (!this._content) {
      this._clearSection();
      this._content = new StatusContent(status);
      this._section.addMenuItem(this._content);
    }
    this._content.update(status);
  }

  showBanner(message: string): void {
    if (!this._banner) {
      this._banner = new PopupMenu.PopupBaseMenuItem({ reactive: false });
      this._banner.add_child(
        new St.Icon({
          icon_name: "dialog-warning-symbolic",
          style_class: "popup-menu-icon",
        }),
      );
      this._banner.add_child(new St.Label({ text: message }));
      this._bannerSection.addMenuItem(this._banner);
    }
    this._banner.visible = true;
  }

  hideBanner(): void {
    if (this._banner) this._banner.visible = false;
  }

  showError(error: string): void {
    this._clearSection();
    this._errorContent = new ErrorContent(error);
    this._section.addMenuItem(this._errorContent);
  }

  setIcon(icon: Gio.Icon): void {
    this._icon.gicon = icon;
  }

  setVisible(): void {
    // panel indicator is always visible once added
  }

  shutdown(): void {
    this._content?.destroy();
    this._errorContent?.destroy();
    this._banner?.destroy();
    this.destroy();
  }

  private _clearSection(): void {
    this._content?.destroy();
    this._content = null;
    this._errorContent?.destroy();
    this._errorContent = null;
    this._section.removeAll();
  }
}

export default GObject.registerClass(
  { Signals: { "refresh-requested": {} } },
  PanelIndicator,
);
