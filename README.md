[![Rendered image](https://raw.githubusercontent.com/co3moz/minecraft-render/master/docs/soul_campfire_small.png)](https://github.com/co3moz/minecraft-render/blob/master/docs/soul_campfire.png)

minecraft-render
=======================

TODO: Update docs for minecraft-render-py.


Renders minecraft block models using `THREE.js`. 
Default output format is PNG `1000x1000`.


### Pre-rendered assets

You can find pre-rendered assets on Github Actions artifacts. By clicking the badge down below, you can access action list.

[![Render Test](https://github.com/co3moz/minecraft-render/actions/workflows/ci.yml/badge.svg)](https://github.com/co3moz/minecraft-render/actions/workflows/ci.yml)


### Headless render and CI

If you are automating generation process on github or similar CI environments, make sure you configured display server. `xvfb` can be used for this purpose.

```sh
sudo apt-get install xvfb
xvfb-run --auto-servernum minecraft-render ...
```


### Notes

<https://minecraft.fandom.com/wiki/Tutorials/Models#Block_states>

- Rework system
- Detach Jar from data reading (interface to provide info, allow for directory sources, or prioritized stacks)
- Incorporate blockstates to configure properly
- Rotate as needed (see: stairs etc)
