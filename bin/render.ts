import { RenderClass } from "../src/dataset/RenderClass";
import { MinecraftAssetsLoader } from "../src/dataset/Loader";
import { ResourcePackLoader } from "../src/dataset/ResourcePackLoader";
import { Logger } from "../src/utils/logger";

(async () => {
  Logger.level = Logger.categories.debug;

  const loader = new ResourcePackLoader(
    await MinecraftAssetsLoader.fetchAll("master", "1.19.1")
  );

  const renderer = new RenderClass(loader, { outDir: "out" });
  for (const [namespace, path] of [
    // ["minecraft", "oak_log"],
    // ["minecraft", "oak_trapdoor"],
    // ["minecraft", "observer"],
    ["minecraft", "flower_pot"],
  ]) {
    console.log(await renderer.renderToFile(namespace, path));
  }
})();
