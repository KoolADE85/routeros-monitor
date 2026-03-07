import Gio from "gi://Gio";

import { RouterOsApi } from "../api.js";
import { InterfaceType, type InterfaceStatus } from "../types.js";

// ── 3GPP TS 36.214 reference signal measurement ranges ───────────────────────
const RSRP_MIN = -140;
const RSRP_MAX = -44;
const RSRQ_MIN = -19;
const RSRQ_MAX = -3;
const SINR_MIN = -23;
const SINR_MAX = 40;
const RSSI_MIN = -110;
const RSSI_MAX = -50;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function normalise(value: number, min: number, max: number): number {
  return Math.round(clamp(((value - min) * 100) / (max - min), 0, 100));
}

function calculateQuality(rsrp: number, rsrq: number, sinr: number): number {
  const rsrpScore = normalise(rsrp, RSRP_MIN, RSRP_MAX);
  const rsrqScore = normalise(rsrq, RSRQ_MIN, RSRQ_MAX);
  const sinrScore = normalise(sinr, SINR_MIN, SINR_MAX);
  return Math.round(rsrpScore * 0.4 + rsrqScore * 0.35 + sinrScore * 0.25);
}

interface RawResponse {
  rsrp?: string;
  rsrq?: string;
  sinr?: string;
  rssi?: string;
  cqi?: string;
  status?: string;
  "current-operator"?: string;
  "access-technology"?: string;
  "primary-band"?: string;
}

function parse(raw: RawResponse): InterfaceStatus {
  const rsrp = parseInt(raw.rsrp ?? "") || RSRP_MIN;
  const rsrq = parseInt(raw.rsrq ?? "") || RSRQ_MIN;
  const sinr = parseInt(raw.sinr ?? "") || SINR_MIN;
  const rssi = raw.rssi ? parseInt(raw.rssi) || null : null;
  const cqi = raw.cqi !== undefined ? parseInt(raw.cqi) : null;
  const qualityPct = calculateQuality(rsrp, rsrq, sinr);

  const operator = raw["current-operator"] ?? "";
  const status = raw.status ?? "unknown";
  const primaryBand = raw["primary-band"] ?? "";
  const bandMatch = primaryBand.match(/^(\S+)/);
  const band = bandMatch ? bandMatch[1] : "";

  const cqiStr = cqi !== null ? `CQI ${cqi}` : "";
  const bandStr = band ? `(${band})` : "";
  const secondaryInfo =
    [cqiStr, bandStr].filter(Boolean).join(" ") || undefined;

  return {
    type: InterfaceType.Lte,
    subtitle: operator || status,
    qualityPct,
    headline: `${qualityPct}% — ${operator || status}`,
    secondaryInfo,
    metrics: [
      {
        label: "RSRP",
        value: `${rsrp} dBm`,
        pct: normalise(rsrp, RSRP_MIN, RSRP_MAX),
      },
      {
        label: "RSRQ",
        value: `${rsrq} dB`,
        pct: normalise(rsrq, RSRQ_MIN, RSRQ_MAX),
      },
      {
        label: "SINR",
        value: `${sinr} dB`,
        pct: normalise(sinr, SINR_MIN, SINR_MAX),
      },
      {
        label: "RSSI",
        value: rssi !== null ? `${rssi} dBm` : "N/A",
        pct: rssi !== null ? normalise(rssi, RSSI_MIN, RSSI_MAX) : null,
      },
    ],
  };
}

export async function queryLteStatus(
  api: RouterOsApi,
  iface: string,
  cancellable: Gio.Cancellable | null,
): Promise<InterfaceStatus> {
  const body = await api.post(
    "/rest/interface/lte/monitor",
    { ".id": iface, once: "" },
    cancellable,
  );
  const entries = Array.isArray(body)
    ? (body as RawResponse[])
    : [body as RawResponse];
  if (entries.length === 0) throw new Error("Empty response from router");
  return parse(entries[0]);
}
