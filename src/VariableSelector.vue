<style scoped>
/* Scroll the checkboxes rather than the card, so the All/None buttons stay reachable when the
   list is taller than the pane */
.variable-list {
	flex: 1 1 0;
	min-height: 0;
	overflow-y: auto;
}
</style>

<template>
	<v-card variant="flat" class="d-flex flex-column fill-height">
		<v-card-title class="pt-2 pb-1">
			<v-icon size="small" class="mr-2">mdi-function-variant</v-icon>
			{{ $t("plugins.ClosedLoopTuning.variables.title") }}
		</v-card-title>

		<v-card-text class="variable-list px-2 py-0 pr-4">
			<v-checkbox v-for="variable in chartableVariables" :key="variable.id"
						v-model="selectedVariables" :label="variable.column" :value="variable"
						:disabled="!availableVariables.includes(variable.column)"
						:color="settingsStore.darkTheme ? variable.colour.dark : variable.colour.light"
						density="compact" hide-details />
		</v-card-text>

		<v-card-actions class="d-flex">
			<v-btn variant="text" @click="selectAll">
				{{ $t("plugins.ClosedLoopTuning.variables.all") }}
			</v-btn>
			<v-spacer />
			<v-btn variant="text" @click="selectedVariables = []">
				{{ $t("plugins.ClosedLoopTuning.variables.none") }}
			</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script setup lang="ts">
import { useSettingsStore } from "DuetWebControl";
import { computed, watch } from "vue";

import { type ClosedLoopVariable, variables } from "./config";

const props = defineProps<{
	availableVariables: Array<string>;
}>();

const selectedVariables = defineModel<Array<ClosedLoopVariable>>({ required: true });

const settingsStore = useSettingsStore();

const chartableVariables = computed(() => variables.filter((variable) => !variable.hideSelect));

function selectAll() {
	selectedVariables.value = chartableVariables.value.filter((variable) => props.availableVariables.includes(variable.column));
}

watch(() => props.availableVariables, () => {
	selectedVariables.value = selectedVariables.value.filter((variable) => props.availableVariables.includes(variable.column));
});
</script>
