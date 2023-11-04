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

export function normalizeResourceLocation(
  namespace: string,
  identifier?: string
): [string, string] {
  if (identifier == undefined) {
    if (!namespace.includes(":")) {
      return ["minecraft", namespace];
    }
    return namespace.split(":", 2) as [string, string];
  }
  return [namespace, identifier];
}

export function stripVariants(identifier: string): [string, string[], number?] {
  // namespace:identifier[variants](index)
  const match =
    /^(?<identifier>[^\]]+?)(?:\[(?<variants>[^\]]+)\])?(?:\((?<index>\d+)\))?$/.exec(
      identifier
    );
  if (match == null || match.groups == null) return [identifier, [], 0];

  return [
    match.groups["identifier"],
    match.groups["variants"]?.split(",") ?? [],
    match.groups["index"] != null ? Number.parseInt(match.groups["index"]) : undefined,
  ];
}

export function resourceLocationAsString(
  namespace: string,
  identifier?: string
): string {
  if (identifier == undefined) {
    namespace = stripVariants(namespace)[0];
    validateResourceLocation(namespace);
    return namespace;
  } else {
    identifier = stripVariants(identifier)[0];
    validateResourceLocation(namespace + ":" + identifier);
    return namespace + ":" + identifier;
  }
}

export function parseJSON<T>(data: Uint8Array): T {
  return JSON.parse(new TextDecoder().decode(data)) as T;
}

export function constructPath(
  objectType: string,
  suffix: string,
  namespace: string,
  identifier?: string
): ResourcePath {
  let variants;
  try {
    [namespace, identifier] = normalizeResourceLocation(namespace, identifier);
    [identifier, variants] = stripVariants(identifier);
    validateResourceLocation(namespace + ":" + identifier);
  } catch (e) {
    throw new Error("Failed to construct path, " + (e as Error).message);
  }

  return { namespace, objectType, identifier, suffix, variants };
}

export function resourcePathAsString(path: ResourcePath): string {
  return `${path.namespace}/${path.objectType}/${path.identifier}.${path.suffix}`;
}
