import Gio from "gi://Gio";
import GLib from "gi://GLib";
import Soup from "gi://Soup?version=3.0";

Gio._promisify(
  Soup.Session.prototype,
  "send_and_read_async",
  "send_and_read_finish",
);

interface ErrorBody {
  detail?: string;
  message?: string;
}

export interface RouterOsConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  useHttps: boolean;
}

export class RouterOsApi {
  private _session: Soup.Session | null;
  private _config: RouterOsConfig;

  constructor(config: RouterOsConfig) {
    this._session = new Soup.Session();
    this._session.timeout = 10;
    this._config = config;
  }

  configure(config: RouterOsConfig): void {
    this._config = config;
  }

  async get(
    path: string,
    cancellable: Gio.Cancellable | null = null,
  ): Promise<unknown> {
    return this._request("GET", path, null, cancellable);
  }

  async post(
    path: string,
    body: Record<string, string>,
    cancellable: Gio.Cancellable | null = null,
  ): Promise<unknown> {
    return this._request("POST", path, body, cancellable);
  }

  private async _request(
    method: string,
    path: string,
    body: Record<string, string> | null,
    cancellable: Gio.Cancellable | null,
  ): Promise<unknown> {
    const { host, port, user, password, useHttps } = this._config;
    const scheme = useHttps ? "https" : "http";
    const portSuffix = port > 0 ? `:${port}` : "";
    const url = `${scheme}://${host}${portSuffix}${path}`;

    const message = Soup.Message.new(method, url);

    if (body !== null) {
      const bodyBytes = new TextEncoder().encode(JSON.stringify(body));
      message.set_request_body_from_bytes(
        "application/json",
        new GLib.Bytes(bodyBytes),
      );
    }
    message.request_headers.append(
      "Authorization",
      `Basic ${GLib.base64_encode(new TextEncoder().encode(`${user}:${password}`))}`,
    );

    let bytes: GLib.Bytes;
    try {
      bytes = await (this._session as Soup.Session).send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        cancellable,
      );
    } catch (e: unknown) {
      const err = e as GLib.Error;
      if (err.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)) throw e;
      throw new Error(`Network error: ${err.message}`);
    }

    const status = message.get_status();
    if (status !== Soup.Status.OK) {
      let detail = "";
      try {
        const errBody = JSON.parse(
          new TextDecoder().decode(bytes.get_data() as Uint8Array),
        ) as ErrorBody;
        detail = errBody.detail || errBody.message || "";
      } catch {
        // ignore parse errors
      }
      throw new Error(
        `HTTP ${status}: ${detail || message.get_reason_phrase()}`,
      );
    }

    return JSON.parse(
      new TextDecoder().decode(bytes.get_data() as Uint8Array),
    ) as unknown;
  }

  destroy(): void {
    this._session = null;
  }
}
