<style scoped>
/* Firefox resolves a percentage height inside a flex column against the content instead of the
   flex line, so the canvas collapsed there while Chrome sized it correctly. A flex child that
   may shrink below its content plus an absolutely positioned canvas sizes the same in both */
.chart-body {
	min-height: 0;
}

.chart-container {
	position: relative;
	min-height: 20rem;
}

.chart-container canvas {
	position: absolute;
}
</style>

<template>
	<v-card variant="flat" class="d-flex flex-column fill-height">
		<v-card-title class="pt-2 pb-1">
			<v-icon class="mr-2">mdi-chart-sankey</v-icon>
			{{ $t("plugins.ClosedLoopTuning.chart.title") }}
		</v-card-title>

		<v-card-text class="chart-body d-flex flex-column flex-grow-1 px-2 py-0">
			<div v-if="!data" class="text-h4 text-disabled text-center pt-16">
				{{ $t("plugins.ClosedLoopTuning.chart.selectFile") }}
			</div>
			<div v-else-if="variables.length === 0" class="text-h4 text-disabled text-center pt-16">
				{{ $t("plugins.ClosedLoopTuning.chart.selectVariables") }}
			</div>

			<v-row v-if="hasData" dense align="center" justify="center" class="flex-grow-0 pt-2">
				<v-col cols="6" sm="3">
					<v-text-field :model-value="startTime" type="number" min="0"
								  :label="$t('plugins.ClosedLoopTuning.chart.start')"
								  density="compact" hide-details
								  @update:model-value="onStartInput" />
				</v-col>
				<v-col cols="6" sm="3">
					<v-text-field :model-value="endTime" type="number" min="0"
								  :label="$t('plugins.ClosedLoopTuning.chart.end')"
								  density="compact" hide-details
								  @update:model-value="onEndInput" />
				</v-col>
				<v-col cols="6" sm="3">
					<v-btn @click="resetRange">
						{{ $t("plugins.ClosedLoopTuning.chart.resetRange") }}
					</v-btn>
				</v-col>
				<v-col cols="6" sm="3">
					<v-checkbox v-model="keepRange" :label="$t('plugins.ClosedLoopTuning.chart.keepRange')"
								density="compact" hide-details color="primary" />
				</v-col>
				<v-col cols="12">
					<v-range-slider v-model="rangeFilter" :min="0" :max="Math.max(sampleCount - 1, 0)"
									:step="1" hide-details />
				</v-col>
			</v-row>

			<div v-show="hasData" class="chart-container flex-grow-1">
				<canvas ref="chartCanvas" />
			</div>
		</v-card-text>
	</v-card>
</template>

<script setup lang="ts">
import type { ChartOptions, ChartType, TooltipPositionerFunction } from "chart.js";
import { Chart, Legend, LinearScale, LineController, LineElement, PointElement, Tooltip } from "chart.js";
import { i18n, useSettingsStore } from "DuetWebControl";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { type ClosedLoopVariable, yAxes } from "./config";

// Chart.js v4 requires explicit registration of every scale, controller and element a chart uses
Chart.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Legend);

// Keep the index tooltip at the pointer. With a dozen traces across four axes the built-in
// positioners snap it to whichever point is nearest, which reads as flicker while scrubbing
declare module "chart.js" {
	interface TooltipPositionerMap {
		cursor: TooltipPositionerFunction<ChartType>;
	}
}
Tooltip.positioners.cursor = (_elements, eventPosition) => eventPosition;

interface ScaleStyle {
	ticks: { color: string };
	grid: { color: string };
	title: { color: string };
}

const props = defineProps<{
	data: Record<string, Array<number>> | null;
	variables: Array<ClosedLoopVariable>;
}>();

const settingsStore = useSettingsStore();

const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chart: Chart<"line"> | undefined;
let applyTimer: ReturnType<typeof setTimeout> | null = null;

const rangeFilter = ref<Array<number>>([0, 0]);
const keepRange = ref(false);
let pendingStart: number | null = null;
let pendingEnd: number | null = null;

const sampleCount = computed(() => props.data?.Sample?.length ?? 0);
const hasData = computed(() => props.data !== null && props.variables.length > 0);

function timestampAt(index: number) {
	const timestamps = props.data?.Timestamp;
	return (timestamps && index >= 0 && index < timestamps.length) ? Math.round(timestamps[index]) : 0;
}

// Derived from the selection rather than mirrored into refs: a two-way binding here feeds every
// snap back in as if the user had typed it, and the range walks itself inwards one sample at a time
const startTime = computed(() => timestampAt(rangeFilter.value[0]));
const endTime = computed(() => timestampAt(rangeFilter.value[1]));

// #region Chart setup
function buildOptions(): ChartOptions<"line"> {
	const scales: ChartOptions<"line">["scales"] = {
		x: {
			type: "linear",
			title: { display: true, text: i18n.global.t("plugins.ClosedLoopTuning.chart.timeAxis") },
			ticks: {},
			grid: {}
		}
	};
	for (const yAxis of yAxes) {
		scales[yAxis.id] = {
			type: "linear",
			position: yAxis.position,
			display: false,
			title: {},
			ticks: {},
			grid: {}
		};
	}

	return {
		animation: false,
		maintainAspectRatio: false,
		interaction: { mode: "index", intersect: false },
		plugins: {
			legend: { labels: {} },
			tooltip: { position: "cursor" }
		},
		scales
	};
}

function styleScale(id: string, ticksColor: string, gridLineColor: string) {
	const scale = chart!.options.scales![id] as unknown as ScaleStyle;
	scale.ticks.color = ticksColor;
	scale.grid.color = gridLineColor;
	scale.title.color = ticksColor;
}

function applyDarkTheme(active: boolean) {
	if (!chart) {
		return;
	}

	const ticksColor = active ? "#FFF" : "#666";
	const gridLineColor = active ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";
	chart.options.plugins!.legend!.labels!.color = ticksColor;
	styleScale("x", ticksColor, gridLineColor);
	for (const yAxis of yAxes) {
		styleScale(yAxis.id, ticksColor, gridLineColor);
	}
	chart.update();
}

function updateChart() {
	if (!chart) {
		return;
	}

	const data = props.data;
	if (data !== null) {
		chart.data.datasets = props.variables.map((variable) => ({
			borderColor: settingsStore.darkTheme ? variable.colour.dark : variable.colour.light,
			borderWidth: 1,
			data: (data[variable.column] ?? []).map((value, index) => ({ x: data.Timestamp[index], y: variable.filter ? variable.filter(value) : value })).slice(rangeFilter.value[0], rangeFilter.value[1] + 1),
			fill: false,
			label: variable.column,
			pointRadius: 0,
			showLine: true,
			tension: 0,
			yAxisID: variable.axis
		}));
	} else {
		chart.data.datasets = [];
	}

	const axesRequired = new Set(props.variables.map((variable) => variable.axis));
	for (const yAxis of yAxes) {
		(chart.options.scales![yAxis.id] as { display: boolean }).display = axesRequired.has(yAxis.id);
	}
	chart.update();
}

// #endregion

// #region Range selection
function resetRange() {
	rangeFilter.value = [0, Math.max(sampleCount.value - 1, 0)];
}

function onStartInput(value: string) {
	pendingStart = parseFloat(value);
	scheduleTimeRange();
}

function onEndInput(value: string) {
	pendingEnd = parseFloat(value);
	scheduleTimeRange();
}

function scheduleTimeRange() {
	if (applyTimer !== null) {
		clearTimeout(applyTimer);
	}
	applyTimer = setTimeout(applyTimeRange, 500);
}

// Snap the typed times onto sample indices. The recorded timestamps are rounded for the comparison
// exactly as the fields display them, so applying a value the field itself showed is a no-op
function applyTimeRange() {
	applyTimer = null;

	const timestamps = props.data?.Timestamp;
	const wantStart = pendingStart ?? startTime.value;
	const wantEnd = pendingEnd ?? endTime.value;
	pendingStart = null;
	pendingEnd = null;
	if (!timestamps || Number.isNaN(wantStart) || Number.isNaN(wantEnd)) {
		return;
	}

	const start = Math.max(timestamps.findIndex((value) => Math.round(value) >= wantStart), 0);
	const end = timestamps.findLastIndex((value) => Math.round(value) <= wantEnd);
	if (end > start) {
		rangeFilter.value = [start, end];
	}
}

// #endregion

// #region Lifecycle and watches
onMounted(() => {
	if (!chartCanvas.value) {
		return;
	}

	chart = new Chart(chartCanvas.value, {
		type: "line",
		options: buildOptions(),
		data: { datasets: [] }
	});
	updateChart();
	applyDarkTheme(settingsStore.darkTheme);
});

onBeforeUnmount(() => {
	if (applyTimer !== null) {
		clearTimeout(applyTimer);
	}
	chart?.destroy();
	chart = undefined;
});

watch(() => props.data, () => {
	// A value typed against the previous file must not be applied to this one
	if (applyTimer !== null) {
		clearTimeout(applyTimer);
		applyTimer = null;
	}
	pendingStart = null;
	pendingEnd = null;

	if (props.data !== null && !keepRange.value) {
		resetRange();
	}
	updateChart();
});

watch(() => props.variables, () => updateChart());

watch(rangeFilter, () => updateChart(), { deep: true });

watch(() => settingsStore.darkTheme, (to) => applyDarkTheme(to));

watch(() => settingsStore.locale, () => {
	if (chart) {
		(chart.options.scales!.x as { title: { text: string } }).title.text = i18n.global.t("plugins.ClosedLoopTuning.chart.timeAxis");
		chart.update();
	}
});

// #endregion
</script>
