import Adw from "gi://Adw";
import { ExtensionPreferences } from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

import { buildConnectionGroup, buildHintGroup } from "./prefs/connection.js";
import { buildDisplayGroup } from "./prefs/display.js";
import { buildInterfaceGroup } from "./prefs/interface.js";

export default class MikroTikPreferences extends ExtensionPreferences {
  // eslint-disable-next-line @typescript-eslint/require-await
  async fillPreferencesWindow(window: Adw.PreferencesWindow): Promise<void> {
    const settings = this.getSettings();

    const page = new Adw.PreferencesPage({
      title: "MikroTik Monitor",
      iconName: "network-cellular-symbolic",
    });
    window.add(page);

    page.add(buildDisplayGroup(settings));
    page.add(buildConnectionGroup(settings));
    page.add(buildInterfaceGroup(settings));
    page.add(buildHintGroup());
  }
}
