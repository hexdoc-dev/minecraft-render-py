import { RenderClass } from "../lib/dataset/RenderClass";
import { MinecraftAssetsLoader } from "../lib/dataset/Loader";
import { Logger } from "../lib/utils/logger";

(async () => {
  Logger.level = Logger.categories.debug;

  const loader = await MinecraftAssetsLoader.fetchAll("master", "1.19.1");
  const renderer = new RenderClass(loader, {
    outDir: "out",
    ambientLight: false,
    plane: false,
  });

  for (const [namespace, path] of [
    ["minecraft:stone"],
    ["minecraft:stone(1)"],
    ["minecraft:campfire[lit=true]"],
    ["minecraft", "flower_pot"],
    ["minecraft", "oak_planks"],
    ["minecraft", "oak_stairs"],
    ["minecraft", "oak_button"],
    ["minecraft", "oak_pressure_plate"],
  ]) {
    await renderer.renderToFile(namespace, path);
  }
})();
