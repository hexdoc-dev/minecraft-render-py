// @ts-ignore
import deepAssign from "assign-deep";
import { AnimationMeta } from "../utils/types";
import {
  ResourceLoader,
  ModelBlock,
  ModelBlockstate,
  ModelBlockstateFile,
} from "./types";
import { constructPath } from "./utils";
import { memoizeLoader } from "./Loader";
import { ResourceLocation } from "../utils/resource";

export class ResourcePackLoader {
  constructor(private loader: ResourceLoader) {
    memoizeLoader(loader);
  }

  getBlockstate(id: ResourceLocation): Promise<ModelBlockstateFile> {
    return this.loader.loadJSON(constructPath("blockstates", "json", id));
  }

  async tryGetBlockstate(id: ResourceLocation) {
    try {
      return await this.getBlockstate(id);
    } catch (e) {}
  }

  getDefaultModelblockstate(id: ResourceLocation): Promise<ModelBlockstate> {
    return this.getBlockstate(id).then((record) => {
      try {
        if ("variants" in record) {
          let blockstate = Object.values(record.variants)[0];
          blockstate = Array.isArray(blockstate) ? blockstate[0] : blockstate;
          return blockstate;
        }
      } catch (e) {}
      throw new Error();
    });
  }

  getTexture(id: ResourceLocation): Promise<Uint8Array> {
    return this.loader.loadTexture(constructPath("textures", "png", id));
  }

  async getAnimationData(id: ResourceLocation): Promise<AnimationMeta | null> {
    try {
      return await this.loader.loadJSON(constructPath("textures", "png.mcmeta", id));
    } catch (e) {
      return null;
    }
  }

  async getTextureAsBuffer(id: ResourceLocation): Promise<Buffer> {
    return Buffer.from(await this.getTexture(id));
  }

  async getModel(id: ResourceLocation): Promise<ModelBlock> {
    const path = constructPath("models", "json", id);
    const inventoryPath = { ...path, identifier: path.identifier + "_inventory" };
    try {
      // prefer inventory-specific models if available (eg. for buttons)
      return await this.loader.loadJSON(inventoryPath);
    } catch (e) {
      return await this.loader.loadJSON(path);
    }
  }

  getModels(id: ResourceLocation): Promise<ModelBlock[]> {
    return this.getModel(id).then((model) => {
      // If we have a parent
      if (model.parent != undefined) {
        return this.getModels(ResourceLocation.parse(model.parent)).then((models) => {
          return models.concat(model);
        });
      } else {
        return [model];
      }
    });
  }

  getCompiledModel(id: ResourceLocation): Promise<ModelBlock> {
    return this.getModels(id).then((models) =>
      models.reduce((o, m) => deepAssign(o, m), {})
    ) as Promise<ModelBlock>;
  }
}
