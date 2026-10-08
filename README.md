# Closed Loop Tuning Plugin

*Visualise the performance of your [1HCL closed loop controller board](https://docs.duet3d.com/Duet3D_hardware/Duet_3_family/Duet_3_Expansion_1HCL) or [Motor23CL closed loop motor](https://docs.duet3d.com/en/Duet3D_hardware/Duet_3_family/Duet_3_Motor_23CL).*


![Image of the plugin UI](https://repository-images.githubusercontent.com/392753893/06488b0a-3573-45ae-a2c7-0017f91d7f48)

## Getting Started

To install the plugin into Duet Web Control (DWC):

1. Navigate to the [latest release](https://github.com/Duet3D/ClosedLoopTuningPlugin/releases) and download the `ClosedLoopTuning-<version>.zip` asset matching your DWC version
2. In DWC, go to Settings > Plugins > External Plugins and upload the ZIP file
3. Click the plugin's row to start it
4. A 'Closed Loop' option appears under Plugins in the left sidebar - you're ready to start tuning!

*This branch targets DWC 3.7 and later. For DWC 3.6 and earlier use the `v3.6-dev` branch and its releases.*

## Compiling from source

Building a DWC plugin needs a DWC checkout, because the build script resolves the plugin's imports against DWC's own sources and type definitions. Clone https://github.com/Duet3D/DuetWebControl, check out the branch matching your DWC version, and run `npm install` in it.

Then build this plugin from the DWC directory:

```
node scripts/build-plugin.js ../ClosedLoopTuningPlugin
```

The script type-checks the sources, compiles them and writes `ClosedLoopTuning-<version>.zip` into this directory, ready to be uploaded as an external plugin. The plugin's own npm dependencies are installed automatically if they are missing, and removed again afterwards.

## Developing

For live reloading, copy or symlink the `src` directory into DWC as `src/plugins/ClosedLoopTuning` together with `plugin.json`, then run `npm run dev` in the DWC directory. DWC discovers every `src/plugins/<id>/plugin.json` as a built-in plugin, so the plugin can be started from Settings > Plugins > Built-in Plugins and any change to a source file is reflected live in the browser.

Note that `chart.js` must then be installed in the DWC checkout rather than here, since an in-tree plugin resolves its dependencies against DWC's `node_modules`.

See [PLUGINS.md](https://github.com/Duet3D/DuetWebControl/blob/v3.7-dev/PLUGINS.md) in the DWC repository for the full plugin development guide.
