<template>
	<div>
		<v-row>
			<v-col cols="12">
				<Recorder
					:recordingProgress="-1"
					@recordingFinished="recordingFinished"
				/>
			</v-col>
		</v-row>
		<v-row>
			<v-col cols="12" sm="6" lg="auto" order="1" order-lg="0">
				<FileSelector 
					ref="selector"
					@fileSelect="selected($event)" 
				/>
			</v-col>

			<v-col cols="12" lg="auto" order="0" order-lg="0" :class="{ 'pa-1': $vuetify.breakpoint.xs }" class="flex-grow-1">
				<Chart 
					:data="loadedData" 
					:variables="variablesToView" 
					class="content flex-grow-1 px-2 py-0" 
				/>
			</v-col>

			<v-col cols="12" sm="6" lg="auto" order="1" order-lg="0">
				<VariableSelector
					v-model="variablesToView"
					:available-variables="availableVariables"
				/>
			</v-col>
		</v-row>
	</div>
</template>

<script>
'use strict'

import { mapActions, mapGetters } from 'vuex'

import Chart from './Chart.vue'
import Recorder from './Recorder.vue'
import FileSelector from './FileSelector.vue'
import VariableSelector from './VariableSelector.vue'


export default {
	components: {
		Chart,
		Recorder,
		FileSelector,
		VariableSelector,
	},
	data: () => ({
		loadedData: null,
		variablesToView: [],
		variablesToRecord: [],
		availableVariables: [],
	}),
	computed: {
		...mapGetters(['isConnected', 'uiFrozen']),
	},
	methods: {
		...mapActions('machine', ['download']),
		parseClosedLoopCSV(inputText) {
			inputText = inputText.split("\n");
			const header = inputText[0].split(",");
			let data = {};
			for (let variable of header) {
				data[variable] = [];
			}
			inputText.slice(1).forEach(row => {
				if (row === "") {
					return;
				}
				row = row.split(",");
				for (let i = 0; i < row.length; i++) {
					data[Object.keys(data)[i]].push(parseFloat(row[i]));
				}
			});
			return data;
		},
		async selected(file) {
			if (!file) {
				this.loadedData = null;
			} else {
				let data = this.parseClosedLoopCSV(await this.download({
					filename: file,
					type: 'text',
					showProgress: false,
					showSuccess: false,
					showError: false
				}));

				this.availableVariables = Object.keys(data).filter(x => x !== "Sample");
				this.loadedData = data;
			}
		},
		recordingFinished() {
			this.$refs.selector.selectMostRecentFile();
		}
	}
}
</script>
