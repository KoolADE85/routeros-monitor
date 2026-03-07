import Gio from "gi://Gio";

import { RouterOsApi } from "../api.js";
import { InterfaceType, type InterfaceStatus } from "../types.js";

interface RawResponse {
  status?: string;
  rate?: string;
}

export async function queryEthernetStatus(
  api: RouterOsApi,
  iface: string,
  cancellable: Gio.Cancellable | null,
): Promise<InterfaceStatus> {
  const body = await api.post(
    "/rest/interface/ethernet/monitor",
    { ".id": iface, once: "" },
    cancellable,
  );
  const entries = Array.isArray(body)
    ? (body as RawResponse[])
    : [body as RawResponse];
  if (entries.length === 0) throw new Error("Empty response from router");
  const raw = entries[0];
  const status = raw.status ?? "unknown";
  return {
    type: InterfaceType.Ether,
    subtitle: iface,
    headline: `${iface} — ${status}`,
    metrics: [
      { label: "Status", value: status },
      { label: "Rate", value: raw.rate || "N/A" },
    ],
  };
}
