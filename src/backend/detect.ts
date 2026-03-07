import Gio from "gi://Gio";

import { RouterOsApi } from "./api.js";
import {
  DetectInternetState,
  isInterfaceType,
  type DetectedInterface,
} from "./types.js";

export class NoInternetError extends Error {
  constructor() {
    super("No interface with internet detected");
    this.name = "NoInternetError";
  }
}

interface DetectStateEntry {
  name: string;
  state: DetectInternetState;
}

interface InterfaceEntry {
  name: string;
  type: string;
}

export async function detectInternetInterface(
  api: RouterOsApi,
  cancellable: Gio.Cancellable | null,
): Promise<DetectedInterface> {
  const states = (await api.get(
    "/rest/interface/detect-internet/state",
    cancellable,
  )) as DetectStateEntry[];

  const internet = states.find((s) => s.state === DetectInternetState.Internet);
  if (!internet) {
    throw new NoInternetError();
  }

  const interfaces = (await api.get(
    `/rest/interface?name=${encodeURIComponent(internet.name)}`,
    cancellable,
  )) as InterfaceEntry[];

  if (interfaces.length === 0) {
    throw new Error(`Interface '${internet.name}' not found`);
  }

  const rawType = interfaces[0].type;
  if (!isInterfaceType(rawType)) {
    throw new Error(
      `Unsupported interface type '${rawType}' for '${internet.name}'`,
    );
  }

  return { name: internet.name, type: rawType };
}
