import Gio from "gi://Gio";
import GObject from "gi://GObject";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as QuickSettingsUI from "resource:///org/gnome/shell/ui/quickSettings.js";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";

import type { InterfaceStatus } from "../../backend/types.js";
import { ErrorContent, StatusContent } from "../components/index.js";
import type { UIAdapter } from "../types.js";

class QuickSettingsIndicator
  extends QuickSettingsUI.SystemIndicator
  implements UIAdapter
{
  private _indicator!: St.Icon;
  private _toggle!: QuickSettingsUI.QuickMenuToggle;
  private _bannerSection!: PopupMenu.PopupMenuSection;
  private _section!: PopupMenu.PopupMenuSection;
  private _content: StatusContent | null = null;
  private _errorContent: ErrorContent | null = null;
  private _banner: PopupMenu.PopupBaseMenuItem | null = null;

  constructor() {
    super();

    this._indicator = this._addIndicator();
    this._indicator.icon_name = "";
    this._indicator.visible = false;

    this._toggle = new QuickSettingsUI.QuickMenuToggle({
      title: "RouterOS",
      iconName: "network-cellular-signal-none-symbolic",
      toggleMode: false,
    });
    this._toggle.menu.setHeader(
      "network-cellular-symbolic",
      "RouterOS Monitor",
    );

    this._bannerSection = new PopupMenu.PopupMenuSection();
    this._toggle.menu.addMenuItem(this._bannerSection);

    this._section = new PopupMenu.PopupMenuSection();
    this._toggle.menu.addMenuItem(this._section);

    this._toggle.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

    const refreshItem = new PopupMenu.PopupMenuItem("Refresh Now");
    refreshItem.activate = () => this.emit("refresh-requested");
    this._toggle.menu.addMenuItem(refreshItem);

    const prefsItem = new PopupMenu.PopupMenuItem("Preferences");
    prefsItem.connect("activate", () => {
      Extension.lookupByURL(import.meta.url)?.openPreferences();
    });
    this._toggle.menu.addMenuItem(prefsItem);

    this.quickSettingsItems.push(this._toggle);
    Main.panel.statusArea.quickSettings.addExternalIndicator(this);
  }

  showStatus(status: InterfaceStatus): void {
    if (!this._content) {
      this._clearSection();
      this._content = new StatusContent(status);
      this._section.addMenuItem(this._content);
    }
    this._content.update(status);
    this._toggle.subtitle = status.subtitle;
    this._toggle.checked = true;
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
    this._toggle.checked = false;
    this._toggle.subtitle = `Error: ${error}`;
  }

  setIcon(icon: Gio.Icon): void {
    this._toggle.gicon = icon;
    this._indicator.gicon = icon;
  }

  setVisible(visible: boolean): void {
    this._indicator.visible = visible;
  }

  shutdown(): void {
    this._content?.destroy();
    this._errorContent?.destroy();
    this._banner?.destroy();
    this.quickSettingsItems.forEach((i) => i.destroy());
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
  QuickSettingsIndicator,
);
