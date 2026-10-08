import { registerPluginMessages, registerRoute } from "DuetWebControl";

import ClosedLoopTuning from "./ClosedLoopTuning.vue";
import en from "./i18n/en.json";

registerPluginMessages("ClosedLoopTuning", { en });

registerRoute(ClosedLoopTuning, {
	Plugins: {
		ClosedLoopTuning: {
			icon: "mdi-chart-bell-curve-cumulative",
			caption: "plugins.ClosedLoopTuning.menuCaption",
			path: "/Plugins/ClosedLoopTuning"
		}
	}
});
