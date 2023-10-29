import { ModelBlock, ModelBlockstateFile, ResourceLoader, ResourcePath } from "./types";

export function createMultiloader(...loaders: ResourceLoader[]): ResourceLoader {
  const loader = {
    async loadTexture(path: ResourcePath): Promise<Uint8Array> {
      for (const childLoader of loaders) {
        try {
          return await childLoader.loadTexture(path);
        } catch (e) {}
      }
      throw new Error(`Could not load "${path}" from any source.`);
    },

    async loadJSON(path: ResourcePath): Promise<any> {
      for (const childLoader of loaders) {
        try {
          return await childLoader.loadJSON(path);
        } catch (e) {}
      }
      throw new Error(`Could not load "${path}" from any source.`);
    },

    async close() {
      return Promise.all(loaders.map((l) => l.close()));
    },
  };

  return loader;
}

interface TextureContent {
  name: string;
  texture?: string;
}

export class MinecraftAssetsLoader implements ResourceLoader {
  protected models: { [name: string]: ModelBlock } = {};
  protected states: { [name: string]: ModelBlockstateFile } = {};
  protected textures: { [name: string]: string } = {};

  protected constructor(protected ref: string, protected version: string) {}

  public static async fetchAll(
    ref: string,
    version: string
  ): Promise<MinecraftAssetsLoader> {
    const loader = new this(ref, version);

    await Promise.all([
      loader.fetchModels(),
      loader.fetchStates(),
      loader.fetchTextures(),
    ]);

    return loader;
  }

  public async loadTexture(path: ResourcePath): Promise<Uint8Array> {
    const { type, name, isBlock } = parsePath(path);
    if (type != "texture")
      throw new Error(`Invalid path type, expected texture: ${type}`);

    if (isBlock) {
      const response = await fetch(this.buildRawURL(`blocks/${name}.png`));
      return Buffer.from(await response.arrayBuffer());
    }

    const result = this.textures[name];
    if (result == null) throw new Error(`Texture not found: ${name}`);
    return decodeTexture(result);
  }

  public async loadJSON(path: ResourcePath): Promise<any> {
    const { type, name } = parsePath(path);

    let result;
    switch (type) {
      case "model":
        result = this.models[name];
        break;
      case "state":
        result = this.states[name];
        break;
      default:
        throw new Error(`Path type ${type} is not JSON: ${path}`);
    }
    if (result == null) throw new Error(`JSON file not found: ${name}`);

    return result;
  }

  public async close(): Promise<any> {}

  public buildURL(path: string): string {
    if (!path.startsWith("minecraft/"))
      throw new Error("Unsupported namespace: " + path);

    path = path
      .replace("minecraft/", "")
      .replace(/^block\//, "blocks/")
      .replace(/^item\//, "items/");

    return this.buildRawURL(path);
  }

  protected buildRawURL(path: string): string {
    const baseURL = "https://raw.githubusercontent.com/PrismarineJS/minecraft-assets";
    return `${baseURL}/${this.ref}/data/${this.version}/${path}`;
  }

  protected async fetchModels() {
    this.models = await this.fetchJSON("blocks_models.json");
  }

  protected async fetchStates() {
    this.states = await this.fetchJSON("blocks_states.json");
  }

  protected async fetchTextures() {
    let textures: TextureContent[] = await this.fetchJSON("texture_content.json");
    this.textures = Object.fromEntries(
      textures
        .filter(({ texture }) => texture != null)
        .map(({ name, texture }) => [name, texture!])
    );
  }

  protected async fetchJSON(path: string): Promise<any> {
    const response = await fetch(this.buildRawURL(path));
    return response.json();
  }
}

function parsePath({ namespace, objectType, identifier }: ResourcePath) {
  if (namespace != "minecraft")
    throw new Error(`Invalid namespace, expected minecraft: ${namespace}`);

  let type: "model" | "state" | "texture";
  switch (objectType) {
    case "models":
      type = "model";
      break;
    case "blockstates":
      type = "state";
      break;
    case "textures":
      type = "texture";
      break;
    default:
      throw new Error(`Invalid objectType: ${objectType}`);
  }

  return {
    type,
    isBlock: identifier.match(/^block\//) != null,
    name: identifier.replace(/^(block|item)\//, ""),
  };
}

function decodeTexture(texture: string): Buffer {
  if (!texture.startsWith("data:image/png;base64,"))
    throw new Error(`Invalid texture: ${texture}`);

  texture = texture.replace("data:image/png;base64,", "");
  return Buffer.from(texture, "base64");
}
