<template>
  <v-card height="100%" class="d-flex flex-column">
    <v-card-title class="pt-2 pb-1">
      <v-icon small class="mr-2">mdi-file-table-box-multiple</v-icon>
      Data Files
      <v-spacer></v-spacer>
      <v-icon class="ml-2" @click="refresh">mdi-refresh</v-icon>
    </v-card-title>

    <v-card-text class="pb-0">
      <v-list dense :v-if="!this.loading">
        <v-list-item-group
          v-model="selectedIndex"
          color="primary"
        >
          <v-list-item
            v-for="(file, index) in displayedFiles"
            :key="file.name"
            :value="index"
          >
            <v-list-item-content>
              <v-list-item-title v-text="file.name"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
      
    </v-card-text>

    <v-spacer></v-spacer>

    <v-card-actions>
      <v-pagination
        v-model="page"
        :length="Math.ceil(files.length / maxFileDisplay)"
        :total-visible="Math.ceil(files.length / maxFileDisplay) > 4 ? 5 : null"
      />
    </v-card-actions>

  </v-card>
</template>

<script>
'use strict'

import { mapState, mapGetters, mapActions } from 'vuex'

export default {
	data: () => ({
    page: 1,
		files: [],
    loading: false,
		selectedIndex: -1,
    maxFileDisplay: 13,
	}),
	computed: {
		...mapGetters(['isConnected', 'uiFrozen']),
    ...mapState('machine/model', {closedLoopDirectory: state => `${state.directories.system}/closed-loop/`}),
    displayedFiles() {
      return this.files.slice((this.page - 1) * this.maxFileDisplay, (this.page) * this.maxFileDisplay);
    }
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
        this.files = this.files.sort((a,b) => b.lastModified - a.lastModified);
			} finally {
				this.loading = false;
			}
		},
    async selectMostRecentFile() {
      await this.refresh();
      this.page = 1;
      this.selectedIndex = 0;
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