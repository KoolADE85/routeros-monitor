import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import { InterfaceType, toInterfaceType } from "../backend/types.js";

const TYPES: { value: InterfaceType; label: string }[] = [
  { value: InterfaceType.Lte, label: "LTE" },
  { value: InterfaceType.Ether, label: "Ethernet" },
];

export function buildInterfaceGroup(
  settings: Gio.Settings,
): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "Interface & Polling" });

  const autoRow = new Adw.SwitchRow({
    title: "Automatically Detect Internet Interface",
  });
  settings.bind(
    "auto-detect",
    autoRow,
    "active",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(autoRow);

  const typeRow = new Adw.ComboRow({ title: "Type" });
  const typeModel = new Gtk.StringList();
  TYPES.forEach((t) => typeModel.append(t.label));
  typeRow.model = typeModel;
  const currentType = toInterfaceType(settings.get_string("interface-type"));
  typeRow.selected = Math.max(
    0,
    TYPES.findIndex((t) => t.value === currentType),
  );
  typeRow.connect("notify::selected", () => {
    settings.set_string("interface-type", TYPES[typeRow.selected].value);
  });
  settings.connect("changed::interface-type", () => {
    const updated = toInterfaceType(settings.get_string("interface-type"));
    const idx = TYPES.findIndex((t) => t.value === updated);
    if (idx >= 0) typeRow.selected = idx;
  });
  group.add(typeRow);

  const nameRow = new Adw.EntryRow({ title: "Interface Name" });
  settings.bind(
    "interface-name",
    nameRow,
    "text",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(nameRow);

  const updateVisibility = () => {
    const auto = settings.get_boolean("auto-detect");
    typeRow.visible = !auto;
    nameRow.visible = !auto;
  };
  settings.connect("changed::auto-detect", updateVisibility);
  updateVisibility();

  const intervalRow = new Adw.SpinRow({
    title: "Poll Interval",
    subtitle: "How often to query the router (seconds)",
    adjustment: new Gtk.Adjustment({
      lower: 1,
      upper: 300,
      step_increment: 1,
      page_increment: 10,
    }),
  });
  settings.bind(
    "poll-interval",
    intervalRow,
    "value",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(intervalRow);

  return group;
}
