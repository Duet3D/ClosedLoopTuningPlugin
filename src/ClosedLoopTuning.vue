<template>
	<v-row class="ma-0">
		<v-col cols="12">
			<Recorder @recording-finished="recordingFinished" />
		</v-col>

		<v-col cols="12" sm="6" lg="auto" order="1" order-lg="0">
			<FileSelector ref="fileSelector" @file-select="fileSelected" />
		</v-col>

		<v-col cols="12" lg="auto" order="0" order-lg="0" class="flex-grow-1">
			<Chart :data="loadedData" :variables="variablesToView" />
		</v-col>

		<v-col cols="12" sm="6" lg="auto" order="1" order-lg="0">
			<VariableSelector v-model="variablesToView" :available-variables="availableVariables" />
		</v-col>
	</v-row>
</template>

<script setup lang="ts">
import { useMachineStore } from "DuetWebControl";
import { ref } from "vue";

import CSV from "@/utils/csv";

import { cachedVariables } from "./cache";
import Chart from "./Chart.vue";
import FileSelector from "./FileSelector.vue";
import Recorder from "./Recorder.vue";
import VariableSelector from "./VariableSelector.vue";

const machineStore = useMachineStore();

const variablesToView = cachedVariables("viewedVariables");
const fileSelector = ref<InstanceType<typeof FileSelector> | null>(null);
const loadedData = ref<Record<string, Array<number>> | null>(null);
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

function recordingFinished() {
	fileSelector.value?.selectMostRecentFile();
}
</script>
