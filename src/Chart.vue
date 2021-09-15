<template>
	<v-card class="d-flex flex-column flex-grow-1" min-height="40rem" height="100%">
		<v-card-title class="pt-2 pb-1">
			<v-icon dense class="mr-2">mdi-chart-sankey</v-icon>
			Data Chart
			<v-spacer></v-spacer>
		</v-card-title>
				
		<v-card-text class="content flex-grow-1 px-2 py-0">

			<div class="text-h4 text--disabled text-center pt-16" v-if="!data">
				Select a file to view
			</div>
			<div class="text-h4 text--disabled text-center pt-16" v-else-if="variables.length == 0">
				Select some variables to plot<br>
			</div>

			<div style="height: 5%;" v-if="data && variables.length > 0">
				<v-range-slider
					
					v-model="rangeFilter"
					hide-details
					:max="data.Sample.length"
					min="0"
				></v-range-slider>
			</div>
			<div style="height: 95%;" v-show="data && variables.length > 0">
				<canvas ref="chart"></canvas>
			</div>

		</v-card-text>
	</v-card>
</template>

<script>
'use strict'

import Chart from 'chart.js'
import { yAxes } from './config.js'

export default {
	data() {
		return {
			chart: null,
			rangeFilter: [0,0],
		}
	},
	props: {
		data: Object,
		variables: Array,
	},
	methods: {
		createChart() {
			this.chart = new Chart.Line(this.$refs.chart, {
				options: {
					animation: {duration: 0},
					maintainAspectRatio: false,
					scales: {xAxes: [{type: 'linear', scaleLabel: {display: true, labelString: "Time Since Start (ms)"}}]}
				},
				data: {
					datasets: []
				}
			});
			this.updateChart();
		},
		updateChart() {
			if (this.data) {
				this.chart.data.datasets = this.variables.map(variable => ({
					yAxisID: variable.axis,
					label: variable.title,
					data: this.data[variable.title] ? 
						this.data[variable.title].map((val, idx) => ({x:this.data.Timestamp[idx], y:variable.filter ? variable.filter(val) : val})).slice(this.rangeFilter[0], this.rangeFilter[1])
						: [],
					borderColor: variable.colour,
					fill: false,
					tension: 0,
				}));

				let axesRequired = this.variables.map(x => x.axis);
				this.chart.options.scales.yAxes = yAxes.filter(yAxis => axesRequired.includes(yAxis.id));
			} else {
				this.chart.data.datasets = [];
				this.chart.options.scales.yAxes = [];
			}

			this.chart.update();
		},
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
				this.rangeFilter = [0, this.data.Sample.length - 1];
				// this.updateChart();	// Called by the watcher on rangeFilter
			} else {
				this.updateChart();
			}
		},
		rangeFilter() {
			this.updateChart();
		}
	}
}
</script>

<style scoped>
canvas {
	position: absolute;
}
</style>