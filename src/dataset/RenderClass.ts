import * as THREE from "three";
import * as rawCanvas from "canvas";
import type {
  AnimationMeta,
  BlockFaces,
  BlockSides,
  Element,
  Face,
  RendererOptions,
  Vector,
  Vector4,
} from "../utils/types";
import { distance, invert, mul, size } from "../utils/vector-math";
import { Logger } from "../utils/logger";
//@ts-ignore
import { createCanvas, loadImage } from "node-canvas-webgl";
import { makeAnimatedPNG } from "../utils/apng";
import { ResourcePackLoader } from "./ResourcePackLoader";
import { resourceLocationAsString } from "./utils";
import { ModelBlock, RenderContext } from "./types";
import * as fs from "fs";
import * as path from "path";

const MATERIAL_FACE_ORDER = ["east", "west", "up", "down", "south", "north"] as const;

export class RenderClass {
  private loader: ResourcePackLoader;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private canvas: rawCanvas.Canvas;
  private camera: THREE.OrthographicCamera;
  private light: THREE.DirectionalLight;
  private textureCache: { [key: string]: any } = {};
  private animatedCache: { [key: string]: AnimationMeta | null } = {};
  private options: RendererOptions;

  constructor(
    loader: ResourcePackLoader,
    {
      outDir,
      width = 1000,
      height = 1000,
      distance = 20,
      plane = 0,
      animation = true,
    }: RendererOptions
  ) {
    this.loader = loader;
    this.scene = new THREE.Scene();
    this.canvas = createCanvas(width, height);

    Logger.debug(
      () => `prepareRenderer(width=${width}, height=${height}, distance=${distance})`
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas as any,
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
    });

    Logger.trace(() => `WebGL initialized`);

    this.renderer.sortObjects = false;

    const aspect = width / height;
    this.camera = new THREE.OrthographicCamera(
      -distance * aspect,
      distance * aspect,
      distance,
      -distance,
      0.01,
      20000
    );

    this.light = new THREE.DirectionalLight(0xffffff, 1.2);
    this.light.position.set(20, 30, -15); // cube directions x => negative:bottom right, y => positive:top, z => negative:bottom left
    this.light.lookAt(0, 0, 0);
    this.scene.add(this.light);

    Logger.trace(() => `Light added to scene`);

    if (plane) {
      const origin = new THREE.Vector3(0, 0, 0);
      const length = 10;
      this.scene.add(
        new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, length, 0xff0000)
      );
      this.scene.add(
        new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), origin, length, 0x00ff00)
      );
      this.scene.add(
        new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), origin, length, 0x0000ff)
      );

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 3);
      const helper = new THREE.PlaneHelper(plane, 30, 0xffff00);
      this.scene.add(helper);

      Logger.debug(() => `Plane added to scene`);
    }

    this.options = { outDir, width, height, distance, plane, animation };
  }

  async destroyRenderer() {
    Logger.debug(() => `Renderer destroy in progress...`);

    await new Promise((resolve) => setTimeout(resolve, 500));
    this.renderer.info.reset();
    (this.canvas as any).__gl__.getExtension("STACKGL_destroy_context").destroy();

    Logger.debug(() => `Renderer destroyed`);
  }

  async renderToFile(namespace: string, identifier?: string) {
    const image = await this.render(namespace, identifier);
    if (!image) return;

    const resourceLocation = resourceLocationAsString(namespace, identifier);
    [namespace, identifier] = resourceLocation.split(":");

    const filePath = `${this.options.outDir}/assets/${namespace}/textures/block/${identifier}.png`;
    const directoryPath = path.dirname(filePath);

    await fs.promises.mkdir(directoryPath, { recursive: true });
    await fs.promises.writeFile(filePath, image);

    return filePath;
  }

  async render(namespace: string, identifier?: string): Promise<Buffer | null> {
    const { canvas, renderer, scene, camera, options } = this;

    const blockstates = await this.loader.getBlockstate(namespace, identifier);

    if ("multipart" in blockstates) {
      console.log("Multipart model, aborting!");
      return null;
    }

    let blockstate = blockstates.variants[Object.keys(blockstates.variants).sort()[0]];
    blockstate = Array.isArray(blockstate) ? blockstate[0] : blockstate;

    const renderContext: RenderContext = {
      identifier: resourceLocationAsString(namespace, identifier),
      rotationY: blockstate?.y ?? 0,
      rotationX: blockstate?.x ?? 0,
      currentTick: 0,
      maxTicks: 0,
    };

    const block = await this.loader.getCompiledModel(blockstate.model);

    const gui = block.display?.gui;

    if (!gui || !block.elements || !block.textures) {
      Logger.debug(() =>
        !gui ? "no gui" : !block.elements ? "no element" : "no texture"
      );
      console.log(!gui ? "no gui" : !block.elements ? "no element" : "no texture");
      return null;
    }

    Logger.trace(
      () => `Started rendering ${resourceLocationAsString(namespace, identifier)}`
    );

    camera.zoom = 1.0 / distance(gui.scale as Vector);

    Logger.trace(() => `Camera zoom = ${camera.zoom}`);

    // block.elements!.reverse();

    const buffers = [];

    do {
      Logger.trace(() => `Frame[${renderContext.currentTick}] started`);

      let i = 0;

      Logger.trace(() => `Element count = ${block.elements!.length}`);

      const modelGroup = new THREE.Group();

      for (const element of block.elements!) {
        Logger.trace(() => `Element[${i}] started rendering`);
        const calculatedSize = size(element.from!, element.to!);

        Logger.trace(() => `Element[${i}] geometry = ${calculatedSize!.join(",")}`);

        const geometry = new THREE.BoxGeometry(...calculatedSize, 1, 1, 1);
        const cube = new THREE.Mesh(
          geometry,
          await this.constructBlockMaterial(renderContext, block, element)
        );

        Logger.trace(
          () => `Element[${i}] position set to ${cube.position.toArray().join(",")}`
        );

        if (element.rotation) {
          const origin = mul(element.rotation.origin!, -0.0625);
          cube.applyMatrix4(new THREE.Matrix4().makeTranslation(...invert(origin)));

          if (element.rotation.axis == "y") {
            cube.applyMatrix4(
              new THREE.Matrix4().makeRotationY(
                THREE.MathUtils.DEG2RAD * element.rotation.angle!
              )
            );
          } else if (element.rotation.axis == "x") {
            cube.applyMatrix4(
              new THREE.Matrix4().makeRotationX(
                THREE.MathUtils.DEG2RAD * element.rotation.angle!
              )
            );
          } else if (element.rotation.axis == "z") {
            cube.applyMatrix4(
              new THREE.Matrix4().makeRotationZ(
                THREE.MathUtils.DEG2RAD * element.rotation.angle!
              )
            );
          }

          cube.applyMatrix4(new THREE.Matrix4().makeTranslation(...origin));
          cube.updateMatrix();

          Logger.trace(() => `Element[${i}] rotation applied`);
        }

        cube.position.set(0, 0, 0);
        cube.position.add(new THREE.Vector3(...element.from!));
        cube.position.add(new THREE.Vector3(...element.to!));
        cube.position.multiplyScalar(0.5);

        cube.renderOrder = ++i;

        modelGroup.add(cube);
      }

      modelGroup.position.set(-8, -8, -8);

      const pivot = new THREE.Group();

      pivot.add(modelGroup);

      pivot.rotateY(THREE.MathUtils.DEG2RAD * renderContext.rotationY);
      pivot.rotateX(THREE.MathUtils.DEG2RAD * renderContext.rotationX);

      scene.add(pivot);

      // Ok, X (first param, rotates around the block, not sure why the value is offset so?)
      const rotation = new THREE.Vector3(...(gui.rotation ?? [0, 0, 0])).add(
        new THREE.Vector3(105, -90, -45)
      );
      camera.position.set(
        ...(rotation
          .toArray()
          .map((x) => Math.sin(x * THREE.MathUtils.DEG2RAD) * 16) as [
          number,
          number,
          number
        ])
      );
      camera.lookAt(0, 0, 0);
      camera.position.add(new THREE.Vector3(...(gui.translation ?? [0, 0, 0])));
      camera.updateMatrix();
      camera.updateProjectionMatrix();

      Logger.trace(() => `Camera position set ${camera.position.toArray().join(",")}`);

      renderer.render(scene, camera);

      const buffer = canvas.toBuffer("image/png");
      buffers.push(buffer);

      Logger.trace(() => `Image rendered, buffer size = ${buffer.byteLength} bytes`);

      scene.remove(pivot);

      Logger.trace(() => `Scene cleared`);

      Logger.trace(() => `Frame[${renderContext.currentTick}] completed`);
    } while (
      options.animation &&
      (renderContext.maxTicks ?? 1) > ++renderContext.currentTick
    );

    return buffers.length == 1
      ? buffers[0]
      : makeAnimatedPNG(buffers, () => ({
          numerator: 1,
          denominator: 10,
        }));
  }

  async constructTextureMaterial(
    renderContext: RenderContext,
    _block: ModelBlock,
    path: string,
    face: Face,
    element: Element,
    direction: BlockFaces
  ) {
    const cache = this.textureCache;
    const animatedCache = this.animatedCache;
    const image = cache[path]
      ? cache[path]
      : (cache[path] = await loadImage(await this.loader.getTextureAsBuffer(path)));

    const animationMeta = animatedCache[path]
      ? animatedCache[path]
      : (animatedCache[path] = await this.loader.getAnimationData(path));

    const width = image.width;
    let height = animationMeta ? width : image.height;
    let frame = 0;

    if (animationMeta) {
      // TODO: Consider custom frame times
      Logger.trace(() => `Face[${direction}] is animated!`);

      const frameCount = image.height / width;

      if (renderContext.currentTick == 0) {
        renderContext.maxTicks = Math.max(
          renderContext.maxTicks || 1,
          frameCount * (animationMeta.frametime || 1)
        );
      } else {
        frame =
          Math.floor(renderContext.currentTick! / (animationMeta.frametime || 1)) %
          frameCount;
      }
    }

    const canvas = rawCanvas.createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    ctx.imageSmoothingEnabled = false;

    if (face.rotation) {
      ctx.translate(width / 2, height / 2);
      ctx.rotate(face.rotation * THREE.MathUtils.DEG2RAD);
      ctx.translate(-width / 2, -height / 2);

      Logger.trace(() => `Face[${direction}] rotation applied`);
    }
    // const uv = face.uv ?? [0, 0, width, height];
    const uv = face.uv ?? generateDefaultUV(element, direction);

    ctx.drawImage(
      image,
      uv[0],
      uv[1] + frame * height,
      uv[2] - uv[0],
      uv[3] - uv[1],
      0,
      0,
      width,
      height
    );

    Logger.trace(() => `Face[${direction}] uv applied`);

    const texture = new THREE.Texture(canvas as any);
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.needsUpdate = true;

    Logger.trace(() => `Face[${direction}] texture is ready`);

    return new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      roughness: 1,
      metalness: 0,
      emissive: 1,
      alphaTest: 0.1,
      aoMapIntensity: "shade" in element && element.shade === false ? 0 : 1,
    });
  }

  async constructBlockMaterial(
    renderContext: RenderContext,
    block: ModelBlock,
    element: Element
  ): Promise<THREE.Material[]> {
    if (!element?.faces) {
      Logger.debug(() => `Element faces are missing, will be skipped`);
      return [];
    }

    return <any>(
      await Promise.all(
        MATERIAL_FACE_ORDER.map((direction) =>
          this.decodeFace(
            renderContext,
            direction,
            element?.faces?.[direction],
            block,
            element
          )
        )
      )
    );
  }

  async decodeFace(
    renderContext: RenderContext,
    direction: BlockFaces,
    face: Face | null | undefined,
    block: ModelBlock,
    element: Element
  ): Promise<THREE.Material | null> {
    if (!face) {
      Logger.trace(() => `Face[${direction}] doesn't exist`);
      return null;
    }

    const decodedTexture = decodeTexture(face.texture, block);

    if (!decodedTexture) {
      Logger.debug(
        () =>
          `Face[${direction}] exist but texture couldn't be decoded! texture=${face.texture}`
      );
      return null;
    }

    return await this.constructTextureMaterial(
      renderContext,
      block,
      decodedTexture!,
      face!,
      element,
      direction
    );
  }
}

function decodeTexture(texture: string, block: ModelBlock): string | null {
  texture = texture ?? "";
  if (!texture) return null;
  if (!texture.startsWith("#")) {
    return texture;
  }

  const correctedTextureName = block.textures![texture.substring(1) as BlockSides]!;

  Logger.trace(() => `Texture "${texture}" decoded to "${correctedTextureName}"`);

  return decodeTexture(correctedTextureName, block);
}

function generateDefaultUV(element: Element, direction: BlockFaces): Vector4 {
  if (element.faces![direction]!.uv!) {
    return element.faces![direction]!.uv as Vector4;
  } else if (direction == "up") {
    // X , Z
    return [
      Math.min(element.from![0], element.to![0]),
      Math.min(element.from![2], element.to![2]),
      Math.max(element.from![0], element.to![0]),
      Math.max(element.from![2], element.to![2]),
    ];
  } else if (direction == "down") {
    return [
      Math.min(element.from![0], element.to![0]),
      Math.min(element.from![2], element.to![2]),
      Math.max(element.from![0], element.to![0]),
      Math.max(element.from![2], element.to![2]),
    ];
  } else if (direction == "north") {
    return [
      Math.min(element.from![0], element.to![0]),
      Math.min(element.from![1], element.to![1]),
      Math.max(element.from![0], element.to![0]),
      Math.max(element.from![1], element.to![1]),
    ];
  } else if (direction == "south") {
    return [
      Math.min(element.from![0], element.to![0]),
      Math.min(element.from![1], element.to![1]),
      Math.max(element.from![0], element.to![0]),
      Math.max(element.from![1], element.to![1]),
    ];
  } else if (direction == "east") {
    return [
      Math.min(element.from![2], element.to![2]),
      Math.min(element.from![1], element.to![1]),
      Math.max(element.from![2], element.to![2]),
      Math.max(element.from![1], element.to![1]),
    ];
  } else if (direction == "west") {
    return [
      Math.min(element.from![2], element.to![2]),
      Math.min(element.from![1], element.to![1]),
      Math.max(element.from![2], element.to![2]),
      Math.max(element.from![1], element.to![1]),
    ];
  } else {
    throw new Error(
      "Could not generate UV, invalid direction " + direction + " provided"
    );
  }
}
