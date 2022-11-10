<template>
	<v-card class="d-flex flex-column fill-height">
		<v-card-title class="pt-2 pb-1">
			<v-icon small class="mr-2">mdi-function-variant</v-icon>
			Variables
		</v-card-title>

		<v-card-text class="content flex-grow-1 px-2 py-0 pr-4">
			<v-checkbox
				dense
				hide-details
				v-for="variable in variables"
				:key="variable.id"
				v-model="selectedVariables"
				:label="variable.title"
				:value="variable"
				:disabled="!availableVariables.includes(variable.title)"
				:color="darkTheme ?  variable.colour.dark : variable.colour.light"
			/>
		</v-card-text>

		<v-spacer/>

		<v-card-actions class="d-flex">
			<v-btn color="darken-1" @click="selectAll">All</v-btn>
			<v-spacer/>
			<v-btn color="darken-1" @click="selectedVariables=[]">None</v-btn>
		</v-card-actions>
	</v-card>
</template>

<script>
'use strict'

import { variables } from './config.js'
import { mapState } from 'vuex'

export default {
	data: () => ({
		variables,
		selectedVariables: []
	}),
	props: {
		value: Array,
		availableVariables: Array,
	},
	mounted() {
		this.selectedVariables = this.value;
	},
	computed: {
		...mapState('settings', ['darkTheme']),
	},
	watch: {
		value() {
			this.selectedVariables = this.value;
		},
		availableVariables() {
			this.selectedVariables = this.selectedVariables.filter(variable => this.availableVariables.includes(variable.title));
		},
		selectedVariables() {
			this.$emit("input", this.selectedVariables);
		}
	},
	methods: {
		selectAll() {
			this.selectedVariables = this.variables.filter(variable => this.availableVariables.includes(variable.title));
		}
	}
}
</script>