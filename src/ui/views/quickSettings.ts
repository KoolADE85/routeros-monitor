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

const MikroTikToggle = GObject.registerClass(
  class MikroTikToggle extends QuickSettingsUI.QuickMenuToggle {
    _bannerSection!: PopupMenu.PopupMenuSection;
    _section!: PopupMenu.PopupMenuSection;
    _refreshItem!: PopupMenu.PopupMenuItem;
    _prefsItem!: PopupMenu.PopupMenuItem;

    constructor() {
      super({
        title: "MikroTik Modem",
        iconName: "network-cellular-signal-none-symbolic",
        toggleMode: false,
      });

      this.menu.setHeader("network-cellular-symbolic", "MikroTik Modem");

      this._bannerSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._bannerSection);

      this._section = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._section);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
      this._refreshItem = new PopupMenu.PopupMenuItem("Refresh Now");
      this.menu.addMenuItem(this._refreshItem);
      this._prefsItem = new PopupMenu.PopupMenuItem("Preferences");
      this.menu.addMenuItem(this._prefsItem);
    }
  },
);

export const QuickSettingsIndicator = GObject.registerClass(
  {
    Signals: {
      "refresh-requested": {},
    },
  },
  class QuickSettingsIndicator
    extends QuickSettingsUI.SystemIndicator
    implements UIAdapter
  {
    private _indicator!: St.Icon;
    private _toggle!: InstanceType<typeof MikroTikToggle>;
    private _content: StatusContent | null = null;
    private _errorContent: ErrorContent | null = null;
    private _banner: PopupMenu.PopupBaseMenuItem | null = null;

    constructor() {
      super();

      this._indicator = this._addIndicator();
      this._indicator.icon_name = "";
      this._indicator.visible = false;

      this._toggle = new MikroTikToggle();
      this._toggle._prefsItem.connect("activate", () => {
        Extension.lookupByURL(import.meta.url)?.openPreferences();
      });
      this._toggle._refreshItem.activate = () => this.emit("refresh-requested");
      this.quickSettingsItems.push(this._toggle);

      Main.panel.statusArea.quickSettings.addExternalIndicator(this);
    }

    showStatus(status: InterfaceStatus): void {
      if (!this._content) {
        this._clearSection();
        this._content = new StatusContent(status);
        this._toggle._section.addMenuItem(this._content);
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
        this._toggle._bannerSection.addMenuItem(this._banner);
      }
      this._banner.visible = true;
    }

    hideBanner(): void {
      if (this._banner) this._banner.visible = false;
    }

    showError(error: string): void {
      this._clearSection();
      this._errorContent = new ErrorContent(error);
      this._toggle._section.addMenuItem(this._errorContent);
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
      this._toggle._section.removeAll();
    }
  },
);
