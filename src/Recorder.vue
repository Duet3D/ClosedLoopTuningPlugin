<template>
  <v-card height="100%">
    <v-card-title class="pt-2 pb-1">
      <v-icon class="mr-2">mdi-record-rec</v-icon>
      Record
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col v-for="colNo in [0,1,2]" :key="colNo" cols="2">
          <v-checkbox
            dense
            hide-details
            v-for="variable in nthThirdOfVariables(colNo)"
            :key="variable.id"
            v-model="selectedVariables"
            :label="variable.title"
            :value="variable"
            :color="variable.colour"
          ></v-checkbox>
        </v-col>
        <!-- <v-col cols="3">
          Vars to rec 2
        </v-col> -->
        <v-col cols="3">
          <v-row>
            <v-col cols="6">
              <v-text-field 
                label="Samples to collect" 
                v-model="sampleCount" 
                :rules="[v => !!v || $t('dialog.inputRequired'), v => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" 
                required 
                autofocus
              >
                <template slot="append">
                  samples
                </template>
              </v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field 
                label="Sample rate" 
                v-model="sampleRate" 
                :rules="[v => !!v || $t('dialog.inputRequired'), v => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" 
                required 
                autofocus
                :hint="`(total ${totalTime} seconds)`"
                persistent-hint
              >
                <template slot="append">
                  /second
                </template>
              </v-text-field>
            </v-col>
          </v-row>
          <v-select
            :items="[{text: 'Immediately', value: 0}, {text: 'On next move', value: 1}]"
            label="Collect data"
            v-model="activateMode"
          ></v-select>
        </v-col>
        <v-col cols="3">
          <v-radio-group class="mt-0 pt-0" label="Movement">
            <v-checkbox
              v-for="manoeuvre in tuningManoeuvres"
              :key="manoeuvre.value"
              :label="manoeuvre.name" 
              v-model="calibrationMovement" 
              :value="manoeuvre.value"
              dense
              hide-details
            />
          </v-radio-group>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="auto">
          <v-btn @click="record" color="info">
            <v-icon class="mr-2">mdi-record</v-icon>
            Record
          </v-btn>
        </v-col>
        <v-col cols="10">
          <v-progress-linear 
            v-if="recordingProgress != null" 
            :indeterminate="recordingProgress == -1" 
            :value="recordingProgress == -1 ? 0 : recordingProgress"
            class="my-4"
          />
        </v-col>
      </v-row>
      <!-- <v-list dense :disabled="this.loading">
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
      </v-list> -->
    </v-card-text>

    <v-dialog v-model="showDialog" persistent width="480">
      <v-card>
        <v-card-title>
          <span class="headline">
            Confirm
          </span>
        </v-card-title>

        <v-card-text>
          You have chosen to perform a movement that will last for the duration of the recording.
          <div class="text-center py-2 font-weight-black error--text">
            This movement may not respect endstops.
          </div>
          Please ensure the axis is in a safe position (usually the center) before proceeding.
        </v-card-text>

        <v-card-actions>
          <v-btn color="error darken-1" text @click="dialogResult(false)">{{ $t('generic.cancel') }}</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="dialogResult(true)">{{ $t('generic.ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-card>
</template>

<script>
'use strict'

import { mapActions } from 'vuex'
import { variables, tuningManoeuvres } from './config.js'

// import { mapState, mapGetters, mapActions } from 'vuex'

export default {
  data: () => ({
    variables,
    sampleRate: 100,
    activateMode: 0,
    tuningManoeuvres,
    sampleCount: 500,
    showDialog: false,
    selectedVariables: [],
    calibrationMovement: [],
    recordingProgress: null,      // null = not recording, -1 = recording but unknown progress, >=0 = recording & known progress
  }),
  methods: {
    ...mapActions('machine', ['sendCode']),
    nthThirdOfVariables(n) {
      let thirdLength = Math.ceil(this.variables.length / 3);
      return this.variables.slice(n * thirdLength, (n+1) * thirdLength);
    },
    dialogResult(res) {
      this.showDialog = false;
      if (res) {
        this.record(true);
      }
    },
    async record(force=false) {
      if (this.calibrationMovement > 0 && !force) {
        this.showDialog = true;
        return;
      }
      this.recordingProgress = -1;

      const reply = await this.sendCode({ code: this.GCODECommand, fromInput: false });
      if (reply.startsWith('Error: ') || reply.startsWith('Warning: ')) {
        alert("Error!");  // TODO: Handle!
      }

      // TODO: Do this using the object model!
      var interval = setInterval(async () => {
        const reply = await this.sendCode({ code: "M569.5 P123.0", fromInput: false, log: false });
        if (reply.startsWith('Warning: M569.5: Closed loop data is not being collected')) {
          this.recordingProgress = null;
          clearInterval(interval);
        } else if (reply.startsWith('Collecting sample:')) {
          let progress = reply.split(":")[1].split("/");
          this.recordingProgress = (parseInt(progress[0]) / parseInt(progress[1])) * 100;
        }
      }, 200);
    }
  },
  computed: {
    totalTime() {
      return Math.round((this.sampleCount / this.sampleRate) * 100) / 100;
    },
    GCODECommand() {
      let pString = `P123.0`;
      let sString = `S${this.sampleCount}`;
      let aString = `A${this.activateMode}`;
      let rString = `R${this.sampleRate}`;
      let dString = `D${this.selectedVariables.reduce((acc, x) => acc + x.filterValue, 0)}`;
      let vString = `V${this.calibrationMovement.reduce((a, b) => a+b, 0)}`;
      return `M569.5 ${pString} ${sString} ${aString} ${rString} ${dString} ${vString}`;
    }
  }
	// data: () => ({
	// 	files: [],
  //   loading: false,
	// 	selectedIndex: -1,
	// }),
	// computed: {
	// 	...mapGetters(['isConnected', 'uiFrozen']),
  //   ...mapState('machine/model', {closedLoopDirectory: state => `${state.directories.system}/closed-loop/`}),
	// },
  // mounted() {
  //   this.refresh();
  // },
	// methods: {
  //   ...mapActions('machine', ['getFileList']),
	// 	async refresh() {
	// 		if (!this.isConnected) {
	// 			this.selectedIndex = -1;
	// 			this.files = [];
	// 			return;
	// 		}

	// 		if (this.loading) {
	// 			// Don't do multiple actions at once
	// 			return;
	// 		}

  //     this.selectedIndex = -1;
	// 		this.loading = true;
	// 		try {
	// 			const files = await this.getFileList(this.closedLoopDirectory);
	// 			this.files = files.filter(file => !file.isDirectory && file.name.endsWith('.csv'));
	// 		} finally {
	// 			this.loading = false;
	// 		}
	// 	},
	// },
  // watch: {
  //   selectedIndex() {
  //     if (this.selectedIndex == -1) {
  //       this.$emit("fileSelect", null);
  //     }
  //     this.$emit("fileSelect", this.closedLoopDirectory + this.files[this.selectedIndex].name);
  //   }
  // }
}
</script>
