<template>
  <v-card height="100%">
    <v-card-title class="pt-2 pb-1">
      <v-icon small class="mr-2">mdi-file-table-box-multiple</v-icon>
      Data Files
      <v-spacer></v-spacer>
      <v-icon class="ml-2" @click="refresh">mdi-refresh</v-icon>
    </v-card-title>

    <v-card-text>
      <v-list dense :disabled="this.loading">
        <v-list-item-group
          v-model="selectedIndex"
          color="primary"
        >
          <v-list-item
            v-for="file in files"
            :key="file.name"
          >
            <v-list-item-content>
              <v-list-item-title v-text="file.name"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-card-text>

  </v-card>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions } from 'vuex'

export default {
	data: () => ({
		files: [],
    loading: false,
		selectedIndex: -1,
	}),
	computed: {
		...mapGetters(['isConnected', 'uiFrozen']),
    ...mapState('machine/model', {closedLoopDirectory: state => `${state.directories.system}/closed-loop/`}),
	},
  mounted() {
    this.refresh();
  },
	methods: {
    ...mapActions('machine', ['getFileList']),
		async refresh() {
			if (!this.isConnected) {
				this.selectedIndex = -1;
				this.files = [];
				return;
			}

			if (this.loading) {
				// Don't do multiple actions at once
				return;
			}

      this.selectedIndex = -1;
			this.loading = true;
			try {
				const files = await this.getFileList(this.closedLoopDirectory);
				this.files = files.filter(file => !file.isDirectory && file.name.endsWith('.csv'));
			} finally {
				this.loading = false;
			}
		},
	},
  watch: {
    selectedIndex() {
      if (this.selectedIndex == -1) {
        this.$emit("fileSelect", null);
      }
      this.$emit("fileSelect", this.closedLoopDirectory + this.files[this.selectedIndex].name);
    }
  }
}
</script>
