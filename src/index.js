'use strict'

import { registerRoute } from '@/routes'

import ClosedLoopTuning from './ClosedLoopTuning.vue'

// Register a route via Settings -> Closed Loop
registerRoute(ClosedLoopTuning, {
	Plugins: {
		ClosedLoopTuning: {
			icon: 'mdi-chart-bell-curve-cumulative',
			caption: 'Closed Loop',
			path: '/ClosedLoopTuning'
		}
	}
});
