import GObject from "gi://GObject";
import St from "gi://St";

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

class ErrorContent extends PopupMenu.PopupBaseMenuItem {
  constructor(message: string) {
    super({ reactive: false });

    const label = new St.Label({ x_expand: true, text: `Error: ${message}` });
    this.add_child(label);

    const copyBtn = new St.Button({
      child: new St.Icon({
        icon_name: "edit-copy-symbolic",
        style_class: "popup-menu-icon",
      }),
      style_class: "button",
      style: "border-radius: 99px; padding: 4px;",
    });
    copyBtn.connect("clicked", () => {
      St.Clipboard.get_default().set_text(
        St.ClipboardType.CLIPBOARD,
        label.get_text(),
      );
    });
    this.add_child(copyBtn);
  }
}

export type ErrorContentRegistered = InstanceType<typeof ErrorContent>;
export const ErrorContentRegistered = GObject.registerClass(ErrorContent);
