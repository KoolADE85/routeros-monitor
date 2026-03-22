import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

const MODE_VALUES = [
  "panel-left",
  "panel-center",
  "panel-right",
  "quick-settings",
];

export function buildDisplayGroup(
  settings: Gio.Settings,
): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "Display" });

  const modeModel = new Gtk.StringList();
  modeModel.append("Top Bar Left");
  modeModel.append("Top Bar Center");
  modeModel.append("Top Bar Right");
  modeModel.append("Quick Settings");

  const modeRow = new Adw.ComboRow({
    title: "Indicator Location",
    subtitle: "Where to show the status indicator",
    model: modeModel,
  });

  const currentMode = settings.get_string("display-mode");
  modeRow.selected = Math.max(0, MODE_VALUES.indexOf(currentMode));

  modeRow.connect("notify::selected", () => {
    settings.set_string("display-mode", MODE_VALUES[modeRow.selected]);
  });
  group.add(modeRow);

  const defaultIconsRow = new Adw.SwitchRow({
    title: "Use Default Icons",
    subtitle: "Use default themed icons instead of custom icons",
  });
  settings.bind(
    "use-default-icons",
    defaultIconsRow,
    "active",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(defaultIconsRow);

  return group;
}
