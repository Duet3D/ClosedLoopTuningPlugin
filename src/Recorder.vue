<template>
   <v-card class="fill-height">
      <v-card-title class="pt-2 pb-1">
         <v-icon class="mr-2">mdi-record-rec</v-icon>
         Record
      </v-card-title>

      <v-card-text>
         <v-row>
            <v-col v-for="colNo in [0, 1, 2]" :key="colNo" cols="2">
               <v-checkbox dense hide-details v-for="variable in nthThirdOfVariables(colNo)" :key="variable.id" v-model="selectedVariables" :label="variable.title" :value="variable" :color="darkTheme ? variable.colour.dark : variable.colour.light" />
            </v-col>
            <v-col cols="3">
               <v-select v-model="selectedDriver" :items="drivers" hint="Only one motor will be driven, axis should be re-homed after tuning" item-text="name" item-value="value" label="Select a driver" single-line persistent-hint class="pb-4" />
               <v-form @submit.prevent="updatePID" v-on:keyup.enter="updatePID">
                  <v-row dense>
                     <v-col cols="4">
                        <v-text-field label="P Value" numeric v-model="pTerm"></v-text-field>
                     </v-col>
                     <v-col cols="4">
                        <v-text-field label="I Value" numeric v-model="iTerm"></v-text-field>
                     </v-col>
                     <v-col cols="4">
                        <v-text-field label="D Value" numeric v-model="dTerm"></v-text-field>
                     </v-col>
                     <v-col cols="4">
                        <v-text-field label="A Value" numeric v-model="aTerm"></v-text-field>
                     </v-col>
                     <v-col cols="4">
                        <v-text-field label="V Value" numeric v-model="vTerm"></v-text-field>
                     </v-col>
                     <v-col cols="4">
                        <v-btn type="submit" :loading="updatingPIDValue">Update</v-btn>
                     </v-col>
                  </v-row>
               </v-form>
               <v-row>
                  <v-col cols="6">
                     <v-text-field label="Samples to collect" v-model="sampleCount" :rules="[(v) => !!v || $t('dialog.inputRequired'), (v) => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" required autofocus>
                        <template #append> samples </template>
                     </v-text-field>
                  </v-col>
                  <v-col cols="6">
                     <v-radio-group v-model="sampleRateContinuous">
                        <v-radio label="As fast as possible" :value="true" dense hide-details />
                        <v-radio :value="false" dense hide-details>
                           <template v-slot:label>
                              <v-text-field label="At a fixed rate" v-model="sampleRate" :rules="[(v) => !!v || $t('dialog.inputRequired'), (v) => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" required autofocus :hint="sampleRateContinuous ? '' : `(total ${totalTime} seconds)`" persistent-hint>
                                 <template slot="append"> /second </template>
                              </v-text-field>
                           </template>
                        </v-radio>
                     </v-radio-group>
                  </v-col>
               </v-row>
            </v-col>
            <v-col cols="3">
               <v-radio-group class="mt-0 pt-0" label="Movement" v-model="calibrationMovement">
                  <v-radio :value="64" label="Step Manoeuvre" dense hide-details> </v-radio>
                  <v-row v-show="calibrationMovement === 64" dense>
                     <v-col cols="12"> Step Manoeuvre Parameters </v-col>
                     <v-col cols="6">
                        <v-text-field label="Speed" persistent-hint v-model="moveSpeed" :rules="[(v) => !!v || $t('dialog.inputRequired'), (v) => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" required autofocus>
                           <template #append> mm/s </template>
                        </v-text-field>
                     </v-col>
                     <v-col cols="6">
                        <v-text-field label="Distance" v-model="moveDistance" :rules="[(v) => !!v || $t('dialog.inputRequired'), (v) => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" required autofocus>
                           <template #append> mm </template>
                        </v-text-field>
                     </v-col>
                     <v-col cols="6">
                        <v-text-field label="Acceleration" v-model="moveAcceleration" :rules="[(v) => !!v || $t('dialog.inputRequired'), (v) => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" required autofocus>
                           <template #append> mm/s^2 </template>
                        </v-text-field>
                     </v-col>
                  </v-row>
                  <v-radio :value="0" hide-details label="Custom G-Code" />
                  <v-row v-show="calibrationMovement === 0" dense >
                     <v-col cols="12">
                        <v-text-field  class="pt-1" label="G-Code" persistent-hint v-model="customGCODE" hint="Enter custom g-code to record" />
                     </v-col>
                  </v-row>
               </v-radio-group>

               <v-select
                  :items="[
                     { text: 'Immediately', value: 0 },
                     { text: 'On next move', value: 1 }
                  ]"
                  label="Collect data"
                  v-model="activateMode"
               ></v-select>
            </v-col>
         </v-row>
         <v-row>
            <v-col cols="auto">
               <v-btn :disabled="!ready || autoTuning || recording" @click="record()" color="info">
                  <v-icon class="mr-2">mdi-record</v-icon>
                  Record
               </v-btn>
               <v-btn class="ml-1" :disabled="selectedDriver == null || autoTuning" @click="autoTune()" color="info">
                  <v-icon>mdi-tune</v-icon>
                  <span class="ml-1">Auto Tune</span>
               </v-btn>
               <v-btn v-if="autoTuning" class="ml-1" @click="cancelAutoTune()" color="error">
                  <v-icon>mdi-tune</v-icon>
                  <span class="ml-1">Cancel</span>
               </v-btn>
               <div class="mt-1">{{ autoTuneText }}</div>
            </v-col>
            <v-col cols="10">
               <div v-if="ready" :class="{ 'pt-2': !error && !warning && recordingProgress == null && calibrationMovement != 0 }" class="font-weight-black info--text">{{ GCODECommand }}</div>
               <div v-if="ready && calibrationMovement == 0" class="font-weight-black info--text">{{ customGCODE }}</div>
               <div v-if="error" class="font-weight-black error--text">{{ error }}</div>
               <div v-if="warning" class="font-weight-black warning--text">{{ warning }}</div>
               <v-progress-linear v-if="recordingProgress != null" :indeterminate="recordingProgress == -1" :value="recordingProgress == -1 ? 0 : recordingProgress" class="mb-4" />
            </v-col>
         </v-row>
      </v-card-text>

      <v-dialog v-model="showDialog" persistent width="480">
         <v-card>
            <v-card-title>
               <span class="headline"> Confirm </span>
            </v-card-title>

            <v-card-text>
               You have chosen to perform a tuning manoeuvre which will move the axis.
               <div class="text-center py-2 font-weight-black error--text">This movement may not respect endstops.</div>
               Please ensure the axis is in a safe position (usually the center) before proceeding.
            </v-card-text>

            <v-card-actions>
               <v-btn color="error darken-1" text @click="dialogResult(false)">
                  {{ $t('generic.cancel') }}
               </v-btn>
               <v-spacer />
               <v-checkbox v-model="dontShowModal" class="pr-2">
                  <template v-slot:label>
                     <span style="font-size: 0.7em">Don't show this again</span>
                  </template>
               </v-checkbox>
               <v-btn color="blue darken-1" text @click="dialogResult(true)">
                  {{ $t('generic.ok') }}
               </v-btn>
            </v-card-actions>
         </v-card>
      </v-dialog>
   </v-card>
</template>

<script>
'use strict';

import { mapState, mapActions } from 'vuex';

import { variables, tuningManoeuvres } from './config.js';

import PIDTune, { AxisParameters } from './PIDTune.js';
// import { mapState, mapGetters, mapActions } from 'vuex'

export default {
   data: () => ({
      variables,
      error: null,
      warning: null,
      sampleRate: 100,
      activateMode: 0,
      tuningManoeuvres,
      sampleCount: 500,
      customGCODE: null,
      showDialog: false,
      selectedDriver: null,
      dontShowModal: false,
      selectedVariables: [],
      calibrationMovement: 64,
      recordingProgress: null, // null = not recording, -1 = recording but unknown progress, >=0 = recording & known progress
      sampleRateContinuous: true,
      pTerm: 0,
      iTerm: 0,
      dTerm: 0,
      aTerm: 0,
      vTerm: 0,
      updatingPIDValue: false,
      autoTuning: false,
      autoTuner: null,
      recording: false,
      autoTuneText: '',
      axisParams: null,
      moveSpeed: 100,
      moveDistance: 50,
      moveAcceleration: 10000
   }),
   methods: {
      ...mapActions('machine', ['sendCode', 'getFileList', 'download']),
      nthThirdOfVariables(n) {
         let filteredVariables = this.variables.filter((v) => !v.hideRecord);
         let thirdLength = Math.ceil(filteredVariables.length / 3);
         return filteredVariables.slice(n * thirdLength, (n + 1) * thirdLength);
      },
      dialogResult(res) {
         this.showDialog = false;
         if (res) {
            this.record(true);
         }
      },
      async record(force = false) {
         this.recording = true;

         //Capture original acceleration
         const originalAcceleration = this.axisParams.acceleration;

         try {
            force |= this.dontShowModal;
            if (this.calibrationMovement !== -1 && !force) {
               this.showDialog = true;
               return;
            }

            if (!this.customGCODE && this.calibrationMovement === 0) {
               this.error = 'Enter a custom GCODE command before recording.';
               return;
            }

            await this.sendCode({ code: `M201 ${this.axisParams.letter}${this.moveAcceleration}`, log: false });
            console.log(this.stepCommand);
            const gcodeToSend = this.calibrationMovement === 0 ? this.GCODECommand + '\n' + this.customGCODE : this.GCODECommand + '\n' + this.stepCommand();
            this.recordingProgress = -1;
            const reply = await this.sendCode({ code: gcodeToSend, fromInput: false });
            if (reply.startsWith('Error: ')) {
               this.error = reply;
               return;
            } else if (reply.startsWith('Warning: ')) {
               this.warning = reply;
            }
            this.error = null;
            this.warning = null;
         } finally {
            //Reset original acceleration
            await this.sendCode({ code: `M201 ${this.axisParams.letter}${originalAcceleration}`, log: false });
            await setTimeout(() => {
               this.recording = false;
            }, 1000);
         }
      },
      stepCommand() {
         return `G91 G1 H2 ${this.axisParams.letter}${this.moveDistance} F${this.moveSpeed * 60} \n G4 P100 \n G1 H2 ${this.axisParams.letter}-${this.moveDistance} F${this.moveSpeed * 60} G90`;
      },
      checkTerm(term) {
         return term != '' && term >= 0;
      },
      async updatePID() {
         if (this.checkTerm(this.pTerm) && this.checkTerm(this.iTerm) && this.checkTerm(this.dTerm)) {
            try {
               this.updatingPIDValue = true;
               await this.sendCode({ code: `M569.1 P${this.selectedDriver}  R${this.pTerm} I${this.iTerm} D${this.dTerm} A${this.aTerm} V${this.vTerm}`, log: true });
            } finally {
               this.updatingPIDValue = false;
            }
         } else {
            console.log('error');
         }
      },
      async autoTune() {
         try {
            if (this.axisParams === null)
               //JER put an error notice around this
               return;
            this.error = null;
            this.autoTuning = true;
            this.autoTuner = new PIDTune(this.sendCode, this.getFileList, this.download, this.selectedDriver, this.updateGraph, this.updateAutotuneText, this.axisParams);
            await this.autoTuner.execute();
            this.pTerm = this.autoTuner.pTerm;
            this.iTerm = this.autoTuner.iTerm;
            this.dTerm = this.autoTuner.dTerm;
         } catch (ex) {
            console.error(ex);
            this.error = ex;
         } finally {
            this.autoTuning = false;
         }
      },
      cancelAutoTune() {
         this.autoTuner.cancel();
         this.autoTuning = false;
      },
      updateGraph(filename, p, i, d) {
         //this.$root.$emit('updatePIDGraph', filename);
         this.pTerm = p;
         this.iTerm = i;
         this.dTerm = d;
      },
      updateAutotuneText(text) {
         this.autoTuneText = text;
      }
   },
   unmounted() {
      this.cancelAutoTune();
   },
   computed: {
      ...mapState('machine/model', {
         boards: (state) => state.boards,
         axes: (state) => state.move.axes
      }),
      ...mapState('settings', ['darkTheme']),
      drivers() {
         let results = [];
         this.axes.forEach((axis) => {
            axis.drivers.forEach((driver) => {
               if (this.boards.some((board) => board && board.canAddress === parseInt(driver.board) && board.closedLoop != null)) {
                  results.push({
                     name: `${axis.letter} axis (driver ${driver.board}.${driver.driver})`,
                     value: `${driver.board}.${driver.driver}`
                  });
               }
            });
         });
         return results;
      },
      closedLoopPoints() {
         if (this.selectedDriver) {
            const canAddress = this.selectedDriver.split('.')[0];
            const board = this.boards.find((board) => board.canAddress == canAddress);
            if (board && board.closedLoop) {
               return board.closedLoop.points;
            }
         }
         return null;
      },
      closedLoopRuns() {
         if (this.selectedDriver) {
            const canAddress = this.selectedDriver.split('.')[0];
            const board = this.boards.find((board) => board.canAddress == canAddress);
            if (board && board.closedLoop) {
               return board.closedLoop.runs;
            }
         }
         return null;
      },
      totalTime() {
         return Math.round((this.sampleCount / this.sampleRate) * 100) / 100;
      },
      GCODECommand() {
         const pString = `P${this.selectedDriver}`;
         const sString = `S${this.sampleCount}`;
         const aString = `A${this.activateMode}`;
         const rString = `R${this.sampleRateContinuous ? 0 : this.sampleRate}`;
         const dString = `D${this.selectedVariables.reduce((acc, x) => acc + x.filterValue, 0)}`;
         //const vString = `V${this.calibrationMovement > 0 ? this.calibrationMovement : 0}`;
         return `M569.5 ${pString} ${sString} ${aString} ${rString} ${dString} V0`;
      },
      ready() {
         return this.selectedDriver !== null && this.selectedVariables.length > 0;
      }
   },
   watch: {
      async selectedDriver(to) {
         if (to) {
            try {
               this.pTerm = 0;
               this.iTerm = 0;
               this.dTerm = 0;
               this.aTerm = 0;
               this.vTerm = 0;
               var queryResults = await this.sendCode({ code: `M569.1 P${to}`, log: false, fromInput: false });
               if (queryResults) {
                  this.pTerm = queryResults.match(/P=[0-9.]+/)[0].substring(2);
                  this.iTerm = queryResults.match(/I=[0-9.]+/)[0].substring(2);
                  this.dTerm = queryResults.match(/D=[0-9.]+/)[0].substring(2);
                  this.aTerm = queryResults.match(/A=[0-9.]+/)[0].substring(2);
                  this.vTerm = queryResults.match(/V=[0-9.]+/)[0].substring(2);
               }

               let selectedAxis = this.axes.filter((axis) => axis.drivers.some((driver) => `${driver.board}.${driver.driver}` === this.selectedDriver));
               if (selectedAxis.length > 0) {
                  selectedAxis = selectedAxis[0];
                  this.moveAcceleration = selectedAxis.acceleration;
                  this.axisParams = new AxisParameters(selectedAxis.letter, selectedAxis.acceleration, selectedAxis.speed, selectedAxis.stepsPerMm, selectedAxis.microstepping.value);
               } else {
                  this.axisParams = null;
               }
            } catch (e) {
               console.log(e);
            }
         }
      },
      calibrationMovement() {
         this.activateMode = 0;
      },
      closedLoopPoints(to) {
         if (this.recordingProgress !== null) {
            this.recordingProgress = (to / this.sampleCount) * 100;
         }
      },
      closedLoopRuns() {
         this.recordingProgress = null;
         this.$emit('recordingFinished');
      }
   }
};
</script>
