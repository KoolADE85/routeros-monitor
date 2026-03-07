import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

export function buildConnectionGroup(
  settings: Gio.Settings,
): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "Router Connection" });

  const hostRow = new Adw.EntryRow({ title: "Host / IP Address" });
  settings.bind("router-host", hostRow, "text", Gio.SettingsBindFlags.DEFAULT);
  group.add(hostRow);

  const userRow = new Adw.EntryRow({ title: "API Username" });
  settings.bind("router-user", userRow, "text", Gio.SettingsBindFlags.DEFAULT);
  group.add(userRow);

  const passwordRow = new Adw.PasswordEntryRow({ title: "API Password" });
  settings.bind(
    "router-password",
    passwordRow,
    "text",
    Gio.SettingsBindFlags.DEFAULT,
  );
  group.add(passwordRow);

  const portRow = new Adw.SpinRow({
    title: "Port",
    adjustment: new Gtk.Adjustment({
      lower: 0,
      upper: 65535,
      step_increment: 1,
      page_increment: 10,
    }),
  });
  settings.bind("router-port", portRow, "value", Gio.SettingsBindFlags.DEFAULT);
  group.add(portRow);

  const httpsRow = new Adw.SwitchRow({
    title: "Use HTTPS",
    subtitle: "Enable if the router www-ssl service is active",
  });
  settings.bind("use-https", httpsRow, "active", Gio.SettingsBindFlags.DEFAULT);
  group.add(httpsRow);

  return group;
}

export function buildHintGroup(): Adw.PreferencesGroup {
  const group = new Adw.PreferencesGroup({ title: "RouterOS Setup" });

  const serviceRow = new Adw.ActionRow({
    title: "Enable the REST API service on the router",
    subtitle: "/ip/service/enable www",
  });
  group.add(serviceRow);

  const hintRow = new Adw.ActionRow({
    title: "Create a read-only API user on the router",
    subtitle:
      "/user/group/add name=api-read policy=read,api,rest-api\n" +
      "/user/add name=api-read group=api-read password=changeme",
  });
  group.add(hintRow);

  return group;
}
