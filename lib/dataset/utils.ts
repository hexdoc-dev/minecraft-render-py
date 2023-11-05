import { ResourceLocation } from "../utils/resource";
import { ResourcePath } from "./types";

/**
 * Validates the format of a resource location
 * @param location resource location in formation namespace:path/to/item
 */
export function validateResourceLocation(location: string) {
  if (!/^[0-9a-z_\-\.]+:[0-9a-z_\-\.\/]+$/.test(location)) {
    throw new Error(`"${location}" is not a valid resource location.`);
  }
}

export function parseJSON<T>(data: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(data)) as T;
}

export function constructPath(
  objectType: string,
  suffix: string,
  id: ResourceLocation
): ResourcePath {
  try {
    validateResourceLocation(id.toId());
  } catch (e) {
    throw new Error("Failed to construct path: " + (e as Error).message);
  }

  return {
    namespace: id.namespace,
    objectType,
    identifier: id.path,
    suffix,
  };
}

export function resourcePathAsString(path: ResourcePath): string {
  return `${path.namespace}/${path.objectType}/${path.identifier}.${path.suffix}`;
}
