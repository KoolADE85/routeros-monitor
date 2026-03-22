import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Secret from "gi://Secret";

const SCHEMA_ID = "org.gnome.shell.extensions.mikrotik";

const schema = Secret.Schema.new(
  SCHEMA_ID,
  Secret.SchemaFlags.DONT_MATCH_NAME,
  {
    purpose: Secret.SchemaAttributeType.STRING,
  },
);

const ATTRS = { purpose: "router-password" };

// The sync keyring calls block the shell if the secrets service isn't running
// (e.g. nested GNOME Shell test sessions). Fall back to GSettings in that case.
function isKeyringAvailable(): boolean {
  try {
    const bus = Gio.DBus.session;
    const reply = bus.call_sync(
      "org.freedesktop.DBus",
      "/org/freedesktop/DBus",
      "org.freedesktop.DBus",
      "NameHasOwner",
      new GLib.Variant("(s)", ["org.freedesktop.secrets"]),
      GLib.VariantType.new("(b)"),
      Gio.DBusCallFlags.NONE,
      1000,
      null,
    );
    return reply.get_child_value(0).get_boolean();
  } catch {
    return false;
  }
}

export function lookupPassword(settings: Gio.Settings): {
  password: string;
  fromKeyring: boolean;
} {
  if (!isKeyringAvailable())
    return {
      password: settings.get_string("router-password"),
      fromKeyring: false,
    };
  return {
    password: Secret.password_lookup_sync(schema, ATTRS, null),
    fromKeyring: true,
  };
}

export function storePassword(settings: Gio.Settings, password: string): void {
  if (!isKeyringAvailable()) {
    settings.set_string("router-password", password);
    return;
  }
  Secret.password_store_sync(
    schema,
    ATTRS,
    Secret.COLLECTION_DEFAULT,
    "RouterOS Monitor — Router Password",
    password,
    null,
  );
  // Write a random value to trigger the settings "changed" signal, notifying
  // the monitor to re-read the password from the keyring.
  settings.set_int("password-updated", Math.floor(Math.random() * 2147483647));
}

export function clearPassword(settings: Gio.Settings): void {
  if (!isKeyringAvailable()) {
    settings.set_string("router-password", "");
    return;
  }
  Secret.password_clear_sync(schema, ATTRS, null);
  settings.set_int("password-updated", Math.floor(Math.random() * 2147483647));
}
