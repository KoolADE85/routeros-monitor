export enum InterfaceType {
  Lte = "lte",
  Ether = "ether",
}

export enum DetectInternetState {
  Internet = "internet",
  Wan = "wan",
  Lan = "lan",
  Unknown = "unknown",
  NoLink = "no-link",
}

export function isInterfaceType(value: string): value is InterfaceType {
  return Object.values(InterfaceType).includes(value as InterfaceType);
}

export function toInterfaceType(value: string): InterfaceType {
  if (isInterfaceType(value)) return value;
  throw new Error(`Unsupported interface type: ${value}`);
}

export interface DetectedInterface {
  name: string;
  type: InterfaceType;
}

export interface Metric {
  label: string;
  value: string;
  pct?: number | null;
}

export interface InterfaceStatus {
  type: InterfaceType;
  subtitle: string;
  headline: string;
  secondaryInfo?: string;
  qualityPct?: number;
  metrics: Metric[];
}
