<style scoped>
.content > div:last-child {
	position: relative;
}

.content > div:last-child > canvas {
	position: absolute;
}
</style>

<template>
	<v-card class="d-flex flex-column flex-grow-1 fill-height" min-height="40rem">
		<v-card-title class="pt-2 pb-1">
			<v-icon dense class="mr-2">mdi-chart-sankey</v-icon>
			Data Chart
		</v-card-title>
				
		<v-card-text class="content flex-grow-1 px-2 py-0">
			<div class="text-h4 text--disabled text-center pt-16" v-if="!data">
				Select a file to view
			</div>
			<div class="text-h4 text--disabled text-center pt-16" v-else-if="variables.length === 0">
				Select some variables to plot<br>
			</div>

			<div style="height: 20%;" v-if="data && variables.length > 0">
				<v-row dense align="center" justify="center">
					<v-col cols="3">
						<v-text-field
							dense
							v-model="min"
							label="Start"
							type="number"
							min="0"
							max="data.Sample.length"
						></v-text-field>
					</v-col>
							<v-col cols="3">
						<v-text-field
							dense
							v-model="max"
							label="End"
							type="number"
							min="0"
							max="data.Sample.length"
						></v-text-field>
					</v-col>
					<v-col cols="3">
						<v-btn @click="resetRange">Reset Range</v-btn>
					</v-col>
					<v-col cols="3" >
							<v-checkbox v-model="keepRange" label="Keep Range"></v-checkbox>
					</v-col>
				<v-col cols="12">
					<v-range-slider
						v-model="rangeFilter"
						hide-details
						:max="data.Sample.length"
						min="0"
					/>
				</v-col>
				</v-row>
			</div>

			<div style="height: 80%;" v-show="data && variables.length > 0">
				<canvas ref="chart"></canvas>
			</div>
		</v-card-text>
	</v-card>
</template>

<script>
'use strict'

import Chart from 'chart.js'
import Vue from 'vue'
import { yAxes } from './config.js'
import { mapState } from 'vuex'
import { max, min } from 'date-fns'

export default {
	data() {
		return {
			chart: null,
			rangeFilter: [0, 0],
			keepRange: false,
			min: 0,
			max: 0,
			debounceTimer: null,
			debounceTimeout: 500,
			rangeUpdate: 0
		}
	},
	props: {
		data: Object,
		variables: Array,
	},
	computed: {
		...mapState('settings', ['darkTheme']),
	},
	methods: {
		createChart() {

			Chart.Tooltip.positioners.cursor = function(chartElements, coordinates) {
		      return coordinates;
    		};

			this.chart = new Chart.Line(this.$refs.chart, {
				options: {
					animation: {
						duration: 0
					},
					tooltips: {
						mode: 'index',
						position:'cursor',
						intersect:false
					},
					maintainAspectRatio: false,
					scales: {
						xAxes: [
							{
								type: 'linear',
								scaleLabel: {
									display: true,
									labelString: "Time Since Start (ms)"
								}
							}
						]
					}
				},
				data: {
					datasets: []
				},
			});
			
			this.updateChart();
		},
		updateChart() {
			if (this.data) {
				this.chart.data.datasets = this.variables.map(variable => ({
					borderColor: this.darkTheme ?  variable.colour.dark : variable.colour.light,
					borderWidth: 1,
					data: this.data[variable.title] ?
						this.data[variable.title]
							.map((val, idx) => ({
								x: this.data.Timestamp[idx],
								y: variable.filter ? variable.filter(val) : val
							}))
							.slice(this.rangeFilter[0], this.rangeFilter[1])
						: [],
					fill: false,
					label: variable.title,
					pointRadius: 0,
					showLine: true,
					tension: 0,
					yAxisID: variable.axis,
				}));

					
				if (this.min !== this.data.Timestamp[this.rangeFilter[0]]) {
						this.min = Math.round(this.data.Timestamp[this.rangeFilter[0]]);
				}


				if (this.max !== Number(this.data.Timestamp[this.rangeFilter[1]])) {
						this.max =Math.round(this.data.Timestamp[this.rangeFilter[1]]);
				}

				const axesRequired = this.variables.map(x => x.axis);
				this.chart.options.scales.yAxes = yAxes.filter(yAxis => axesRequired.includes(yAxis.id));
			} else {
				this.chart.data.datasets = [];
				this.chart.options.scales.yAxes = [];
			}
			this.chart.update();
		},
		resetRange() {
			this.rangeFilter = [0, this.data.Sample.length - 1];
		},
		debounceUpdateChart() { 
			if (this.debounceTimer) {
				clearTimeout(this.debounceTimer)
			}
			this.debounceTimer = setTimeout(() => {
				let min = this.data.Timestamp.findIndex(val => val >= this.min);
				let max = this.data.Timestamp.findLastIndex(val => val <= this.max);
				Vue.set(this.rangeFilter, 0,min);	// Vue.set is required to trigger the watcher (rangeFilter
				Vue.set(this.rangeFilter, 1, max);	// Vue.set is required to trigger the watcher (rangeFilter
				this.updateChart();
				this.debounceTimer = null;
			}, this.debounceTimeout);
		}
	},
	mounted() {
		this.createChart();
	},
	watch: {
		variables() {
			this.updateChart();
		},
		data() {
			if (this.data) {
				if (!this.keepRange) {
					this.rangeFilter = [0, this.data.Sample.length - 1];
				}
				// this.updateChart();	// Called by the watcher on rangeFilter
			} else {
				this.updateChart();
			}
		},
		rangeFilter() {
			this.rangeUpdate = Date.now();

			this.updateChart();
		},
		darkTheme() {
			this.updateChart();
		},
		min(value) {
			if (this.rangeFilter[0] !== value && Date.now() -  this.rangeUpdate > 1000 ) {
				this.debounceUpdateChart();
			}
		},
		max(value) {
			if (this.rangeFilter[1] !== value && Date.now() -  this.rangeUpdate > 1000 ) {
				this.debounceUpdateChart();
			}
		}
	}
}
</script>