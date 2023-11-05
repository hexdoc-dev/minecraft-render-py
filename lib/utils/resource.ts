const PREFERRED_VARIANTS = [
  "facing=west",
  "axis=y",
  "face=wall",
  "attachment=floor",
  "lit=false",
  "powered=false",
  "shape=straight",
] as const;

const RESOURCE_LOCATION_REGEX =
  /^(?:(?<namespace>[0-9a-z_\-.]+):)?(?<path>[0-9a-z_\-./]+)$/;

export class ResourceLocation {
  constructor(
    public namespace: string,
    public path: string,
    public preferredVariants: string[] = [],
    public variantIndex: number = 0
  ) {}

  static parse(raw: string): ResourceLocation {
    const match = RESOURCE_LOCATION_REGEX.exec(raw);
    if (!match || !match.groups) throw new Error(`Invalid ResourceLocation: ${raw}`);
    return new this(match.groups["namespace"] ?? "minecraft", match.groups["path"]);
  }

  toId(): string {
    return `${this.namespace}:${this.path}`;
  }

  toString(): string {
    let result = this.toId();

    if (this.preferredVariants.length)
      result += `[${this.preferredVariants.join(",")}]`;

    if (this.variantIndex) result += `(${this.variantIndex})`;

    return result;
  }

  sortVariant(variant: string): number {
    let sortKey = 0;
    for (const preferred of PREFERRED_VARIANTS) {
      if (variant.includes(preferred)) sortKey -= 1;
    }
    for (const preferred of this.preferredVariants) {
      if (variant.includes(preferred)) sortKey -= 100;
    }
    if (variant.includes("face=wall") && variant.includes("facing=east")) sortKey -= 1;
    return sortKey;
  }
}
