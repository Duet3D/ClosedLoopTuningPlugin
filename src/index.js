'use strict'

import { registerRoute } from '../../routes'

import ClosedLoopTuning from './ClosedLoopTuning.vue'

// Register a route via Settings -> Object Model
registerRoute(ClosedLoopTuning, {
	Settings: {
		ObjectModel: {
			icon: 'mdi-chart-bell-curve-cumulative',
			caption: 'Closed Loop',
			path: '/ClosedLoopTuning'
		}
	}
});
