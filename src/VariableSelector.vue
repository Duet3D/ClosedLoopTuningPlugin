<template>
  <v-card height="100%" class="pr-4">
    <v-card-title class="pt-2 pb-1">
      <v-icon small class="mr-2">mdi-function-variant</v-icon>
      Variables
    </v-card-title>

    <v-card-text class="content flex-grow-1 px-2 py-0">
      <v-checkbox
        dense
        hide-details
        v-for="variable in variables"
        :key="variable.id"
        v-model="selectedVariables"
        :label="variable.title"
        :value="variable"
        :disabled="!availableVariables.includes(variable.title)"
        :color="variable.colour"
      ></v-checkbox>
    </v-card-text>

  </v-card>
</template>

<script>
'use strict'

import { variables } from './config.js'

export default {
	data: () => ({
		variables,
		selectedVariables: [],
	}),
  props: {
    value: Array,
    availableVariables: Array,
  },
  mounted() {
    this.selectedVariables = this.value;
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
  }
}
</script>