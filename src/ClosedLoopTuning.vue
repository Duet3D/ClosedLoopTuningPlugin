<style scoped>
/* Let the window and its items grow into the page-fill card so the chart can size against the
   viewport. The window must also be allowed to shrink below its content, or a tall tab pushes
   the tab bar out of the card instead of scrolling inside it */
.closed-loop-window {
	min-height: 0;
}

.closed-loop-window :deep(.v-window__container),
.closed-loop-window :deep(.v-window-item) {
	height: 100%;
}

.data-pane {
	min-height: 0;
}

@media (min-width: 960px) {
	.file-pane {
		width: 20rem;
	}

	.variable-pane {
		width: 16rem;
	}

	/* Flex children default to min-width auto, so the chart would refuse to shrink beside the panes */
	.chart-pane {
		min-width: 0;
	}
}
</style>

<template>
	<v-row class="ma-0">
		<v-col cols="12">
			<v-card :class="['d-flex', 'flex-column', { 'dwc-page-fill': mdAndUp }]">
				<v-tabs v-model="tab" density="compact">
					<v-tab value="record">
						<v-icon class="mr-1">mdi-record-rec</v-icon>
						{{ $t("plugins.ClosedLoopTuning.tabs.record") }}
					</v-tab>
					<v-tab value="data">
						<v-icon class="mr-1">mdi-chart-sankey</v-icon>
						{{ $t("plugins.ClosedLoopTuning.tabs.data") }}
					</v-tab>
				</v-tabs>

				<v-window v-model="tab" :touch="false" class="closed-loop-window flex-grow-1 d-flex flex-column">
					<v-window-item value="record" class="h-100 overflow-y-auto">
						<Recorder @recording-finished="recordingFinished" />
					</v-window-item>

					<v-window-item value="data" class="h-100">
						<div class="data-pane d-flex flex-column flex-md-row h-100">
							<FileSelector ref="fileSelector" class="file-pane flex-shrink-0" @file-select="fileSelected" />
							<Chart class="chart-pane flex-grow-1" :data="loadedData" :variables="variablesToView" />
							<VariableSelector v-model="variablesToView" class="variable-pane flex-shrink-0"
											  :available-variables="availableVariables" />
						</div>
					</v-window-item>
				</v-window>
			</v-card>
		</v-col>
	</v-row>
</template>

<script setup lang="ts">
import { useMachineStore } from "DuetWebControl";
import { nextTick, ref } from "vue";
import { useDisplay } from "vuetify";

import CSV from "@/utils/csv";

import Chart from "./Chart.vue";
import type { ClosedLoopVariable } from "./config";
import FileSelector from "./FileSelector.vue";
import Recorder from "./Recorder.vue";
import VariableSelector from "./VariableSelector.vue";

const machineStore = useMachineStore();
const { mdAndUp } = useDisplay();

const tab = ref<"record" | "data">("record");
const fileSelector = ref<InstanceType<typeof FileSelector> | null>(null);
const loadedData = ref<Record<string, Array<number>> | null>(null);
const variablesToView = ref<Array<ClosedLoopVariable>>([]);
const availableVariables = ref<Array<string>>([]);

function parseClosedLoopCsv(content: string) {
	const csv = new CSV(content);
	const data: Record<string, Array<number>> = {};
	csv.headers.forEach((header, index) => {
		data[header] = csv.content.map((row) => parseFloat(row[index]));
	});
	return data;
}

async function fileSelected(filename: string | null) {
	if (filename === null) {
		loadedData.value = null;
		availableVariables.value = [];
		return;
	}

	try {
		const data = parseClosedLoopCsv(await machineStore.download({ filename, type: "text" }, false, false));
		availableVariables.value = Object.keys(data).filter((header) => header !== "Sample" && header !== "Timestamp");
		loadedData.value = data;
	} catch {
		loadedData.value = null;
		availableVariables.value = [];
	}
}

// The file list only exists once its tab has been rendered, so switch first and let it mount
async function recordingFinished() {
	tab.value = "data";
	await nextTick();
	fileSelector.value?.selectMostRecentFile();
}
</script>
