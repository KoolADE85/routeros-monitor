# RouterOS Monitor

A GNOME Shell extension for monitoring MikroTik routers from your top bar using the RouterOS REST API.

Using RouterOS's `detect-internet` feature, you can see at a glance whether your router's ethernet or LTE interface is internet-connected. The LTE interface also shows sparklines that monitor cellular signal strength.

Not affiliated with MikroTik.

## Installation

### From source

Requires [just](https://github.com/casey/just), Node.js, and npm.

```sh
just install
```

This will compile and deploy the extension to `~/.local/share/gnome-shell/extensions/`.

### From zip

```sh
just pack
```

Then install the resulting `.zip` via GNOME Extensions or `gnome-extensions install`.

## Setup

The extension connects to your MikroTik router over its REST API. You'll need to:

1. Enable the REST API on your router (Services > www-ssl or www)
2. Configure the router address and credentials in the extension preferences. Credentials are stored securely in the GNOME keyring.

## Development

### Build commands

```sh
just build    # lint + compile + copy metadata/schemas to build/
just install  # build + deploy to local extensions directory
```

### Testing

```sh
dbus-run-session gnome-shell --devkit --wayland
```
