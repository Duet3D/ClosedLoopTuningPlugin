# Closed Loop Tuning Plugin

*Visualise the performance of your [1HCL closed loop controller board](https://duet3d.dozuki.com/Wiki/Duet_3_Expansion_1HCL).*


![Image of the plugin UI](https://repository-images.githubusercontent.com/392753893/06488b0a-3573-45ae-a2c7-0017f91d7f48)

## Getting Started

To install the plugin into Duet Web Control (DWC):

1. Navigate to the [latest release](https://github.com/Duet3D/Closed-Loop-Plugin/releases) and download the `closed-loop-plugin.zip` asset
2. Upload the zip folder to DWC by using the 'upload system files' button in the 'system' area.
3. Follow the on-screen instructions for installing the plugin
4. Navigate to Setting > Machine Specific > Machine Specific Plugins and click the 'Start' button
5. A 'closed loop' option should appear in the left sidebar - you're ready to start tuning!

*Please note that DWC 3.3.0 is the minimum supported version of DWC. If you have difficulty following the above instructions, or if the plugin does not work as expected, please ensure you have [updated to the latest version of DWC](https://duet3d.dozuki.com/Wiki/Installing_and_Updating_Firmware).*

## Contributing and Compiling from source

If you don't fancy using the latest release, or you wish to contribute changes, you can compile this plugin yourself from source. To do this, you first need to clone the Duet Web Control (DWC) repo from https://github.com/Duet3D/DuetWebControl.

Once you have DWC cloned, copy the `/src` folder from this repository into the `/src/plugins` folder in DWC. Then, rename the newly copied `/src/plugins/src` folder to `/src/plugins/ClosedLoopTuning`.

Copy the following object into the `export default` array in DWC's `/src/plugins/index.js`

```js
new DwcPlugin({
  id: 'ClosedLoopTuning',
  name: 'Closed Loop Tuning',
  author: 'Louis Irwin',
  version,
  loadDwcResources: () => import(
    /* webpackChunkName: "ClosedLoopTuning" */
    './ClosedLoopTuning/index.js'
  )
})
```

If you wish to develop on the plugin, run `npm run serve` and open the resulting build in your browser. You can then navigate to Settings > General > Built-in Plugins and click 'start' to run the plugin. Any changes made in `/src/plugins/ClosedLoopTuning` will then be hot-reloaded and reflected live in the browser.

Once you have finished developing, or if you just wish to compile from source, run `npm run build`. This will generate the `/dist` directory within DWC. Copy all the files that start `ClosedLoopTuning....js` from `/dist/js` in **DWC** into the `dist/dwc` folder in **this** repository. Repeat and copy all the files from DWC's `/dist/css` that start `ClosedLoopTuning....css` into this repositories `/dist/dwc` directory.

Finally, compress the contents of this repositories `dist` folder into a zip file (such that `plugin.json` is at the top level of the zip folder).