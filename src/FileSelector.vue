<template>
   <v-card class="d-flex flex-column fill-height">
      <v-card-title class="pt-2 pb-1">
         <v-icon small class="mr-2">mdi-file-table-box-multiple</v-icon>
         Data Files
         <v-spacer />
         <v-icon class="ml-2" @click="refresh">mdi-refresh</v-icon>
         <v-icon v-if="!isDeleting" class="ml-2" @click="deleteDialog = true">mdi-delete</v-icon>
         <v-progress-circular  class="disable-transition ml-2" size="24" v-else :value="deleteProgress"></v-progress-circular>
      </v-card-title>

      <v-card-text class="pb-0">
         <v-list dense :v-if="!loading">
            <div v-if="files.length > 200" class="w-full error--text text-center mb-3">
               Warning: You have {{ this.files.length }} data files<br />
               You may wish to delete some to save space
            </div>
            <v-list-item-group v-model="selectedIndex" color="primary">
               <v-list-item v-for="(file, index) in displayedFiles" :key="file.name" :value="index">
                  <v-list-item-content>
                     <v-list-item-title>
                        <div class="mt-1 float-left">
                           {{ file.name }}
                        </div>
                        <v-icon class="ml-2 float-right" @click.stop="deleteFile(file.name)">mdi-delete</v-icon>
                     </v-list-item-title>
                  </v-list-item-content>
               </v-list-item>
            </v-list-item-group>
         </v-list>
         <v-dialog :value="deleteDialog" width="480" persistent>
            <v-card>
               <v-card-title> Delete All Files </v-card-title>
               <v-card-text> Are you sure you want to delete all CSV files? </v-card-text>
               <v-card-actions>
                  <v-spacer />
                  <v-btn class="mr-1" @click="deleteAll()" color="error">Delete</v-btn>
                  <v-btn @click="deleteDialog = false">Cancel</v-btn>
               </v-card-actions>
            </v-card>
         </v-dialog>
      </v-card-text>
      <v-spacer />

      <v-card-actions>
         <v-pagination v-model="page" :length="Math.ceil(files.length / maxFileDisplay)" :total-visible="Math.ceil(files.length / maxFileDisplay) > 4 ? 5 : null" class="mx-auto" />
      </v-card-actions>
   </v-card>
</template>

<style lang="scss">
.disable-transition {
   transition: none !important;
   .v-progress-circular__overlay {
      transition: none;
   }
}
</style>

<script>
'use strict';

import { mapGetters, mapActions } from 'vuex';

import Path from '../../utils/path.js';

export default {
   data: () => ({
      page: 1,
      files: [],
      loading: false,
      selectedIndex: -1,
      maxFileDisplay: 13,
      deleteDialog: false,
      isDeleting: false,
      deleteProgress: 0
   }),
   computed: {
      ...mapGetters(['isConnected', 'uiFrozen']),
      displayedFiles() {
         return this.files.slice((this.page - 1) * this.maxFileDisplay, this.page * this.maxFileDisplay);
      }
   },
   mounted() {
      this.refresh();
      this.$root.$on('updatePIDGraph', () => {
         this.selectMostRecentFile();
      });
   },
   unmounted() {
      this.$root.$off('updatePIDGraph');
   },
   methods: {
      ...mapActions('machine', {
         getFileList: 'getFileList',
         machineDelete: 'delete'
      }),
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
            this.files = (await this.getFileList(Path.closedLoop)).filter((file) => !file.isDirectory && file.name.endsWith('.csv')).sort((a, b) => b.lastModified - a.lastModified);
         } finally {
            this.loading = false;
         }
      },
      async selectMostRecentFile() {
         await this.refresh();
         this.page = 1;
         this.selectedIndex = 0;
      },
      async deleteFile(fileName) {
         try {
            await this.machineDelete(Path.combine(Path.closedLoop, fileName));
            await this.refresh();
         } catch (e) {
            this.$makeNotification('error', this.$t('notification.delete.errorTitle', [fileName]), e.message);
         }
      },
      async deletePage() {
         for (let i = (this.page - 1) * this.maxFileDisplay; i < this.page * this.maxFileDisplay; i++) {
            if (i >= this.files.length) {
               continue;
            }

            try {
               await this.machineDelete(Path.combine(Path.closedLoop, this.files[i].name));
            } catch (e) {
               this.$makeNotification('error', this.$t('notification.delete.errorTitle', [this.files[i].name]), e.message);
            }
         }
         await this.refresh();
      },
      async deleteAll() {
         try {
            this.deleteDialog = false;
            this.isDeleting = true;
            for (let i = 0; i < this.files.length; i++) {
               try {
                  this.deleteProgress = (i / this.files.length) * 100;
                  await this.machineDelete(Path.combine(Path.closedLoop, this.files[i].name));
               } catch (e) {
                  this.$makeNotification('error', this.$t('notification.delete.errorTitle', [this.files[i].name]), e.message);
               }
            }
            await this.refresh();
         } finally {
            this.isDeleting = false;
            this.deleteProgress = 0;
         }
      }
   },
   watch: {
      selectedIndex(to) {
         this.$emit('fileSelect', to >= 0 && to < this.files.length ? Path.combine(Path.closedLoop, this.files[to].name) : null);
      }
   }
};
</script>
