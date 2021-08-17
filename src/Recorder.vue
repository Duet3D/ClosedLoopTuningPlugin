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
        <v-col cols="3">
          <v-select
            v-model="selectedDriver"
            :items="availableAxes"
            hint="Axes with > 1 drive will not show."
            item-text="name"
            item-value="value"
            label="Select a driver"
            single-line
            persistent-hint
            class="pb-4"
          />
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
              <v-radio-group v-model="sampleRateContinuous">
                <v-radio
                  label="As fast as possible"
                  :value="true"
                  dense
                  hide-details
                />
                <v-radio
                  :value="false"
                  dense
                  hide-details
                >
                  <template v-slot:label>
                    <v-text-field 
                      label="At a fixed rate" 
                      v-model="sampleRate" 
                      :rules="[v => !!v || $t('dialog.inputRequired'), v => isNumber(parseFloat(v)) || $t('dialog.numberRequired')]" 
                      required 
                      autofocus
                      :hint="sampleRateContinuous ? '' : `(total ${totalTime} seconds)`"
                      persistent-hint
                    >
                      <template slot="append">
                        /second
                      </template>
                    </v-text-field>
                  </template>
                </v-radio>
              </v-radio-group>
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
              :disabled="manoeuvre.disabled"
              dense
              hide-details
            />
            <v-checkbox
              v-model="calibrationMovement"
              :value="0"
              hide-details
            >
              <template v-slot:label>
                <v-text-field
                  label="Custom GCODE"
                  v-model="customGCODE"
                />
              </template>
            </v-checkbox>
          </v-radio-group>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="auto">
          <v-btn :disabled="!ready" @click="record" color="info">
            <v-icon class="mr-2">mdi-record</v-icon>
            Record
          </v-btn>
        </v-col>
        <v-col cols="10">
          <div v-if="ready && calibrationMovement.includes(0)" class="font-weight-black info--text">{{ customGCODE }}</div>
          <div v-if="ready" :class="{'pt-2': !error && !warning && recordingProgress == null && !calibrationMovement.includes(0)}" class="font-weight-black info--text">{{ GCODECommand }}</div>
          <div v-if="error" class="font-weight-black error--text">{{ error }}</div>
          <div v-if="warning" class="font-weight-black warning--text">{{ warning }}</div>
          <v-progress-linear 
            v-if="recordingProgress != null" 
            :indeterminate="recordingProgress == -1" 
            :value="recordingProgress == -1 ? 0 : recordingProgress"
            class="mb-4"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-dialog v-model="showDialog" persistent width="480">
      <v-card>
        <v-card-title>
          <span class="headline">
            Confirm
          </span>
        </v-card-title>

        <v-card-text>
          You have chosen to perform a tuning manoeuvre which will move the axis a small distance.
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

import { mapState, mapActions } from 'vuex'
import { variables, tuningManoeuvres } from './config.js'

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
    selectedVariables: [],
    calibrationMovement: [],
    recordingProgress: null,      // null = not recording, -1 = recording but unknown progress, >=0 = recording & known progress
    sampleRateContinuous: true,
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
        this.record(null, true);
      }
    },
    async record(_, force=false) {
      if (this.calibrationMovement.length > 0 && !force) {
        this.showDialog = true;
        return;
      }

      if (this.calibrationMovement.includes(0)) {
        const reply = await this.sendCode({ code: this.customGCODE, fromInput: false });
        if (reply.startsWith('Error: ')) {
          this.error = reply;
          return;
        } else if (reply.startsWith('Warning: ')) {
          this.warning = reply;
        }
      }

      const reply = await this.sendCode({ code: this.GCODECommand, fromInput: false });
      if (reply.startsWith('Error: ')) {
        this.error = reply;
        return;
      } else if (reply.startsWith('Warning: ')) {
        this.warning = reply;
      }

      this.error = null;
      this.warning = null;
      this.recordingProgress = -1;

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
      }, 750);
    }
  },
  computed: {
    ...mapState('machine/model', {axes: state => state.move.axes.map(axis => ({letter: axis.letter, drivers: axis.drivers}))}),
    availableAxes() {
      return this.axes.filter(x => x.drivers.length == 1).map(x => ({name: `${x.letter} (${x.drivers[0]})`, value: x.drivers[0]}));
    },
    totalTime() {
      return Math.round((this.sampleCount / this.sampleRate) * 100) / 100;
    },
    GCODECommand() {
      let pString = `P${this.selectedDriver}`;
      let sString = `S${this.sampleCount}`;
      let aString = `A${this.activateMode}`;
      let rString = `R${this.sampleRateContinuous ? 0 : this.sampleRate}`;
      let dString = `D${this.selectedVariables.reduce((acc, x) => acc + x.filterValue, 0)}`;
      let vString = `V${this.calibrationMovement.reduce((a, b) => a+b, 0)}`;
      return `M569.5 ${pString} ${sString} ${aString} ${rString} ${dString} ${vString}`;
    },
    ready() {
      return this.selectedDriver != null
        && this.selectedVariables.length > 0;
    },
  }
}
</script>
