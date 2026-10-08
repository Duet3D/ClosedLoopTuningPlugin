import { useCacheStore } from "DuetWebControl";
import { computed } from "vue";

import { type ClosedLoopVariable, StepManoeuvre, variables } from "./config";

export const PluginId = "ClosedLoopTuning";

/**
 * Everything the user sets on the page. The page component is unmounted on every route change, so
 * these live in DWC's cache store rather than in component state and survive navigating away
 */
export const cacheDefaults = {
	selectedDriver: null as string | null,
	recordedVariables: [] as Array<string>,
	viewedVariables: [] as Array<string>,
	sampleCount: 500,
	sampleRate: 100,
	sampleRateContinuous: true,
	activateMode: 0,
	calibrationMovement: StepManoeuvre,
	customGCode: "",
	moveSpeed: 100,
	moveDistance: 50,
	moveAcceleration: 10000,
	skipMovementWarning: false
};

type CacheKey = keyof typeof cacheDefaults;

export function registerCacheDefaults() {
	const cacheStore = useCacheStore();
	for (const key of Object.keys(cacheDefaults) as Array<CacheKey>) {
		cacheStore.registerPluginData(PluginId, key, cacheDefaults[key]);
	}
}

/**
 * Two-way binding to one cached value, usable wherever a ref would be
 */
export function cached<K extends CacheKey>(key: K) {
	const cacheStore = useCacheStore();
	return computed<(typeof cacheDefaults)[K]>({
		get: () => cacheStore.plugins[PluginId]?.[key] ?? cacheDefaults[key],
		set: (value) => cacheStore.setPluginData(PluginId, key, value)
	});
}

/**
 * Variable selection as descriptors. Only the ids are cached, since the descriptors carry filter
 * functions that would not survive the round trip through storage
 */
export function cachedVariables(key: "recordedVariables" | "viewedVariables") {
	const ids = cached(key);
	return computed<Array<ClosedLoopVariable>>({
		get: () => variables.filter((variable) => ids.value.includes(variable.id)),
		set: (value) => {
			ids.value = value.map((variable) => variable.id);
		}
	});
}
