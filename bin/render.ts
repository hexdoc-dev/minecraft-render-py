import { RenderClass } from "../lib/dataset/RenderClass";
import { MinecraftAssetsLoader } from "../lib/dataset/Loader";
import { Logger } from "../lib/utils/logger";
import { ResourceLocation } from "../lib/utils/resource";

(async () => {
  Logger.level = Logger.categories.debug;

  const loader = await MinecraftAssetsLoader.fetchAll("master", "1.19.1");
  const renderer = new RenderClass(loader, {
    outDir: "out",
    ambientLight: false,
    plane: false,
  });

  const blocks: [string, string, string[]?, number?][] = [
    ["minecraft", "stone"],
    ["minecraft", "stone", [], 1],
    ["minecraft", "campfire", ["lit=true"]],
    ["minecraft", "flower_pot"],
    ["minecraft", "oak_planks"],
    ["minecraft", "oak_stairs"],
    ["minecraft", "oak_button"],
    ["minecraft", "oak_pressure_plate"],
  ];

  for (const [namespace, path, preferredVariants, variantIndex] of blocks) {
    await renderer.renderToFile(
      new ResourceLocation(namespace, path, preferredVariants, variantIndex)
    );
  }
})();
