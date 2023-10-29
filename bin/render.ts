import { RenderClass } from "../lib/dataset/RenderClass";
import { MinecraftAssetsLoader } from "../lib/dataset/Loader";
import { Logger } from "../lib/utils/logger";

(async () => {
  Logger.level = Logger.categories.debug;

  const loader = await MinecraftAssetsLoader.fetchAll("master", "1.19.1");
  const renderer = new RenderClass(loader, { outDir: "out" });

  for (const [namespace, path] of [
    ["minecraft", "oak_log"],
    // ["minecraft", "oak_trapdoor"],
    // ["minecraft", "observer"],
  ]) {
    console.log(await renderer.renderToFile(namespace, path));
  }
})();
