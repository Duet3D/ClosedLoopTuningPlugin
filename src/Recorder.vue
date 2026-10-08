<template>
	<v-card class="fill-height">
		<v-card-title class="pt-2 pb-1">
			<v-icon class="mr-2">mdi-record-rec</v-icon>
			{{ $t("plugins.ClosedLoopTuning.recorder.title") }}
		</v-card-title>

		<v-row class="px-4 pt-2">
			<v-col cols="12" lg="5">
				<div class="text-subtitle-1 mb-2">{{ $t("plugins.ClosedLoopTuning.recorder.valuesToRecord") }}</div>
				<v-row dense>
					<v-col v-for="column in [0, 1, 2]" :key="column" cols="12" sm="4">
						<v-checkbox v-for="variable in nthThirdOfVariables(column)" :key="variable.id"
									v-model="selectedVariables" :label="variable.column" :value="variable"
									:color="settingsStore.darkTheme ? variable.colour.dark : variable.colour.light"
									density="compact" hide-details />
					</v-col>
				</v-row>
			</v-col>

			<v-col cols="12" sm="6" lg="4">
				<v-select v-model="selectedDriver" :items="drivers" item-title="name" item-value="value"
						  :label="$t('plugins.ClosedLoopTuning.recorder.selectDriver')"
						  :hint="$t('plugins.ClosedLoopTuning.recorder.driverHint')"
						  :disabled="uiStore.uiFrozen" persistent-hint density="compact" />

				<div class="text-subtitle-1 mt-6 mb-2">{{ $t("plugins.ClosedLoopTuning.recorder.tuningConstants") }}</div>
				<v-form @submit.prevent="updatePID">
					<v-row dense>
						<v-col cols="4">
							<v-text-field v-model="pTerm" type="number" :label="$t('plugins.ClosedLoopTuning.recorder.pValue')" density="compact" hide-details />
						</v-col>
						<v-col cols="4">
							<v-text-field v-model="iTerm" type="number" :label="$t('plugins.ClosedLoopTuning.recorder.iValue')" density="compact" hide-details />
						</v-col>
						<v-col cols="4">
							<v-text-field v-model="dTerm" type="number" :label="$t('plugins.ClosedLoopTuning.recorder.dValue')" density="compact" hide-details />
						</v-col>
						<v-col cols="4">
							<v-text-field v-model="aTerm" type="number" :label="$t('plugins.ClosedLoopTuning.recorder.aValue')" density="compact" hide-details />
						</v-col>
						<v-col cols="4">
							<v-text-field v-model="vTerm" type="number" :label="$t('plugins.ClosedLoopTuning.recorder.vValue')" density="compact" hide-details />
						</v-col>
						<v-col cols="4" class="d-flex">
							<v-btn type="submit" :disabled="!canUpdatePID" :loading="updatingPID" block>
								{{ $t("plugins.ClosedLoopTuning.recorder.update") }}
							</v-btn>
						</v-col>
					</v-row>
				</v-form>

				<div class="text-subtitle-1 mt-6 mb-2">{{ $t("plugins.ClosedLoopTuning.recorder.sampling") }}</div>
				<v-text-field v-model.number="sampleCount" type="number" min="1" :rules="numberRules"
							  :label="$t('plugins.ClosedLoopTuning.recorder.sampleCount')"
							  :suffix="$t('plugins.ClosedLoopTuning.recorder.samples')" density="compact" />

				<v-radio-group v-model="sampleRateContinuous" hide-details class="mb-2">
					<v-radio :value="true" :label="$t('plugins.ClosedLoopTuning.recorder.asFastAsPossible')" density="compact" />
					<v-radio :value="false" :label="$t('plugins.ClosedLoopTuning.recorder.atFixedRate')" density="compact" />
				</v-radio-group>

				<v-text-field v-model.number="sampleRate" type="number" min="1" :rules="numberRules"
							  :disabled="sampleRateContinuous"
							  :label="$t('plugins.ClosedLoopTuning.recorder.sampleRate')"
							  :suffix="$t('plugins.ClosedLoopTuning.recorder.perSecond')"
							  :hint="$t('plugins.ClosedLoopTuning.recorder.totalTime', [totalTime])"
							  persistent-hint density="compact" />
			</v-col>

			<v-col cols="12" sm="6" lg="3">
				<div class="text-subtitle-1 mb-2">{{ $t("plugins.ClosedLoopTuning.recorder.movement") }}</div>
				<v-radio-group v-model="calibrationMovement" hide-details>
					<v-radio :value="StepManoeuvre" :disabled="!canStepManoeuvre"
							 :label="$t('plugins.ClosedLoopTuning.recorder.stepManoeuvre')" density="compact" />

					<v-row v-show="calibrationMovement === StepManoeuvre" dense class="mt-1">
						<v-col cols="6">
							<v-text-field v-model.number="moveSpeed" type="number" min="1" :rules="numberRules"
										  :label="$t('plugins.ClosedLoopTuning.recorder.speed')" suffix="mm/s" density="compact" />
						</v-col>
						<v-col cols="6">
							<v-text-field v-model.number="moveDistance" type="number" min="1" :rules="numberRules"
										  :label="$t('plugins.ClosedLoopTuning.recorder.distance')" suffix="mm" density="compact" />
						</v-col>
						<v-col cols="12">
							<v-text-field v-model.number="moveAcceleration" type="number" min="1" :rules="numberRules"
										  :label="$t('plugins.ClosedLoopTuning.recorder.acceleration')" suffix="mm/s^2" density="compact" />
						</v-col>
					</v-row>

					<div v-if="selectedDriver !== null && !canStepManoeuvre" class="text-caption text-warning mb-2">
						{{ $t("plugins.ClosedLoopTuning.recorder.extruderNeedsCustomGCode") }}
					</div>

					<v-radio :value="CustomGCode" :label="$t('plugins.ClosedLoopTuning.recorder.customGCode')" density="compact" />

					<v-text-field v-show="calibrationMovement === CustomGCode" v-model="customGCode" class="mt-2"
								  :label="$t('plugins.ClosedLoopTuning.recorder.gcode')"
								  :hint="$t('plugins.ClosedLoopTuning.recorder.gcodeHint')"
								  persistent-hint density="compact" />
				</v-radio-group>

				<v-select v-model="activateMode" :items="activateModes" item-title="title" item-value="value"
						  :label="$t('plugins.ClosedLoopTuning.recorder.collectData')"
						  :disabled="uiStore.uiFrozen" density="compact" class="mt-6" hide-details />
			</v-col>
		</v-row>

		<v-divider class="my-4" />

		<v-row align="center" class="px-4 pb-2">
			<v-col cols="12" sm="auto">
				<v-btn color="info" :disabled="!ready || recording || uiStore.uiFrozen" @click="record">
					<v-icon class="mr-2">mdi-record</v-icon>
					{{ $t("plugins.ClosedLoopTuning.recorder.record") }}
				</v-btn>
			</v-col>
			<v-col cols="12" sm>
				<div v-if="ready" class="font-weight-black text-info">{{ collectionCommand }}</div>
				<div v-if="ready && calibrationMovement === CustomGCode" class="font-weight-black text-info">{{ customGCode }}</div>
				<div v-if="error" class="font-weight-black text-error">{{ error }}</div>
				<div v-if="warning" class="font-weight-black text-warning">{{ warning }}</div>
				<v-progress-linear v-if="recordingProgress !== null" :indeterminate="recordingProgress < 0"
								   :model-value="Math.max(recordingProgress, 0)" class="mt-2" />
			</v-col>
		</v-row>

		<v-dialog v-model="showDialog" width="480" persistent>
			<v-card>
				<v-card-title>
					<span class="text-h5">{{ $t("plugins.ClosedLoopTuning.recorder.confirmTitle") }}</span>
				</v-card-title>

				<v-card-text>
					{{ $t("plugins.ClosedLoopTuning.recorder.confirmText") }}
					<div class="text-center py-2 font-weight-black text-error">
						{{ $t("plugins.ClosedLoopTuning.recorder.confirmWarning") }}
					</div>
					{{ $t("plugins.ClosedLoopTuning.recorder.confirmHint") }}
				</v-card-text>

				<v-card-actions>
					<v-btn color="error" variant="text" @click="showDialog = false">
						{{ $t("generic.cancel") }}
					</v-btn>
					<v-spacer />
					<v-checkbox v-model="dontShowModal" class="pr-2" density="compact" hide-details>
						<template #label>
							<span class="text-caption">{{ $t("plugins.ClosedLoopTuning.recorder.dontShowAgain") }}</span>
						</template>
					</v-checkbox>
					<v-btn color="primary" variant="text" @click="confirmRecord">
						{{ $t("generic.ok") }}
					</v-btn>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</v-card>
</template>

<script setup lang="ts">
import { type AxisLetter, type DriverId, ExpansionBoard } from "@duet3d/objectmodel";
import { i18n, useMachineStore, useSettingsStore, useUiStore } from "DuetWebControl";
import { computed, onMounted, ref, watch } from "vue";

import { getErrorMessage } from "@/utils/errors";

import { cached, cachedVariables } from "./cache";
import { CustomGCode, StepManoeuvre, variables } from "./config";

const emit = defineEmits<{
	recordingFinished: [];
}>();

const machineStore = useMachineStore();
const settingsStore = useSettingsStore();
const uiStore = useUiStore();

const numberRules = [
	(value: unknown) => (value !== null && value !== undefined && value !== "") || i18n.global.t("dialog.inputRequired"),
	(value: unknown) => !Number.isNaN(parseFloat(String(value))) || i18n.global.t("dialog.numberRequired")
];

const selectedDriver = cached("selectedDriver");
const selectedVariables = cachedVariables("recordedVariables");
const sampleCount = cached("sampleCount");
const sampleRate = cached("sampleRate");
const sampleRateContinuous = cached("sampleRateContinuous");
const activateMode = cached("activateMode");
const calibrationMovement = cached("calibrationMovement");
const customGCode = cached("customGCode");
const moveSpeed = cached("moveSpeed");
const moveDistance = cached("moveDistance");
const moveAcceleration = cached("moveAcceleration");

const pTerm = ref("0");
const iTerm = ref("0");
const dTerm = ref("0");
const aTerm = ref("0");
const vTerm = ref("0");
const updatingPID = ref(false);

const error = ref<string | null>(null);
const warning = ref<string | null>(null);
const recording = ref(false);
const showDialog = ref(false);
const dontShowModal = cached("skipMovementWarning");

// null = not recording, negative = recording with unknown progress, otherwise percent complete
const recordingProgress = ref<number | null>(null);

// Acceleration of the axis the selected driver belongs to, null for an extruder driver
const axisParams = ref<{ letter: AxisLetter, acceleration: number } | null>(null);

const activateModes = computed(() => [
	{ title: i18n.global.t("plugins.ClosedLoopTuning.recorder.immediately"), value: 0 },
	{ title: i18n.global.t("plugins.ClosedLoopTuning.recorder.onNextMove"), value: 1 }
]);

// #region Driver selection
function driverIdToString(driver: DriverId) {
	return `${driver.board}.${driver.driver}`;
}

function isClosedLoopDriver(driver: DriverId) {
	return machineStore.model.boards.some((board) => board instanceof ExpansionBoard && board.canAddress === driver.board && board.closedLoop !== null);
}

const drivers = computed(() => {
	const results: Array<{ name: string, value: string }> = [];
	for (const axis of machineStore.model.move.axes) {
		for (const driver of axis.drivers) {
			if (isClosedLoopDriver(driver)) {
				results.push({ name: i18n.global.t("plugins.ClosedLoopTuning.recorder.axisDriver", [axis.letter, driverIdToString(driver)]), value: driverIdToString(driver) });
			}
		}
	}
	machineStore.model.move.extruders.forEach((extruder, index) => {
		if (extruder.driver !== null && isClosedLoopDriver(extruder.driver)) {
			results.push({ name: i18n.global.t("plugins.ClosedLoopTuning.recorder.extruderDriver", [index, driverIdToString(extruder.driver)]), value: driverIdToString(extruder.driver) });
		}
	});
	return results;
});

const closedLoopBoard = computed(() => {
	if (selectedDriver.value === null) {
		return null;
	}
	const canAddress = parseInt(selectedDriver.value.split(".")[0]);
	const board = machineStore.model.boards.find((item) => item instanceof ExpansionBoard && item.canAddress === canAddress);
	return (board instanceof ExpansionBoard) ? board.closedLoop : null;
});

function applyAxisParams(driver: string | null) {
	const axis = (driver !== null) ? machineStore.model.move.axes.find((item) => item.drivers.some((item2) => driverIdToString(item2) === driver)) : undefined;
	axisParams.value = (axis !== undefined) ? { letter: axis.letter, acceleration: axis.acceleration } : null;
	return axis ?? null;
}

// #endregion

// #region PID terms
const canUpdatePID = computed(() => selectedDriver.value !== null && !uiStore.uiFrozen && [pTerm, iTerm, dTerm, aTerm, vTerm].every((term) => term.value !== "" && parseFloat(term.value) >= 0));

function readTerm(reply: string, letter: string) {
	return reply.match(new RegExp(`${letter}=([0-9.]+)`))?.[1] ?? "0";
}

function resetTuningConstants() {
	for (const term of [pTerm, iTerm, dTerm, aTerm, vTerm]) {
		term.value = "0";
	}
}

async function readTuningConstants(driver: string) {
	try {
		// M569.1 reports the tuning constants but does not surface them in the object model, so the reply has to be parsed
		const reply = await machineStore.sendCode(`M569.1 P${driver}`, false, false);
		pTerm.value = readTerm(reply, "P");
		iTerm.value = readTerm(reply, "I");
		dTerm.value = readTerm(reply, "D");
		aTerm.value = readTerm(reply, "A");
		vTerm.value = readTerm(reply, "V");
	} catch (e) {
		console.warn(e);
	}
}

async function updatePID() {
	if (!canUpdatePID.value) {
		return;
	}

	updatingPID.value = true;
	try {
		await machineStore.sendCode(`M569.1 P${selectedDriver.value} R${pTerm.value} I${iTerm.value} D${dTerm.value} A${aTerm.value} V${vTerm.value}`);
	} finally {
		updatingPID.value = false;
	}
}

// #endregion

// #region Recording
const totalTime = computed(() => Math.round((sampleCount.value / sampleRate.value) * 100) / 100);

const canStepManoeuvre = computed(() => axisParams.value !== null);

const collectionCommand = computed(() => {
	const filter = selectedVariables.value.reduce((acc, variable) => acc + variable.filterValue, 0);
	return `M569.5 P${selectedDriver.value} S${sampleCount.value} A${activateMode.value} R${sampleRateContinuous.value ? 0 : sampleRate.value} D${filter} V0`;
});

const stepCommand = computed(() => {
	const letter = axisParams.value?.letter ?? "";
	const feedRate = moveSpeed.value * 60;
	return `G91\nG1 H2 ${letter}${moveDistance.value} F${feedRate}\nG4 P100\nG1 H2 ${letter}-${moveDistance.value} F${feedRate}\nG90`;
});

const ready = computed(() => selectedDriver.value !== null && selectedVariables.value.length > 0);

function nthThirdOfVariables(column: number) {
	const recordable = variables.filter((variable) => !variable.hideRecord);
	const thirdLength = Math.ceil(recordable.length / 3);
	return recordable.slice(column * thirdLength, (column + 1) * thirdLength);
}

function record() {
	if (!ready.value || recording.value) {
		return;
	}

	if (calibrationMovement.value === CustomGCode) {
		if (!customGCode.value) {
			error.value = i18n.global.t("plugins.ClosedLoopTuning.recorder.enterGCode");
			return;
		}
		startRecording();
	} else if (dontShowModal.value) {
		startRecording();
	} else {
		showDialog.value = true;
	}
}

function confirmRecord() {
	showDialog.value = false;
	startRecording();
}

async function startRecording() {
	error.value = null;
	warning.value = null;
	recording.value = true;
	recordingProgress.value = -1;

	// The step manoeuvre is driven at its own acceleration, so the axis limit is raised for the run and put back afterwards
	const axis = (calibrationMovement.value === StepManoeuvre) ? axisParams.value : null;
	try {
		if (axis !== null) {
			await machineStore.sendCode(`M201 ${axis.letter}${moveAcceleration.value}`, false, false);
		}

		// Collection is requested ahead of the movement so sampling is armed before the move starts
		const reply = await machineStore.sendCode(`${collectionCommand.value}\n${(calibrationMovement.value === CustomGCode) ? customGCode.value : stepCommand.value}`);
		if (reply.startsWith("Error: ")) {
			error.value = reply;
			recordingProgress.value = null;
		} else if (reply.startsWith("Warning: ")) {
			warning.value = reply;
		}
	} catch (e) {
		error.value = getErrorMessage(e);
		recordingProgress.value = null;
	} finally {
		if (axis !== null) {
			await machineStore.sendCode(`M201 ${axis.letter}${axis.acceleration}`, false, false);
		}
		recording.value = false;
	}
}

// #endregion

// #region Watches
// Restoring a cached driver must not re-apply the axis acceleration over the value the user set
onMounted(() => {
	if (selectedDriver.value !== null) {
		applyAxisParams(selectedDriver.value);
		readTuningConstants(selectedDriver.value);
	}
});

watch(selectedDriver, (to) => {
	resetTuningConstants();
	const axis = applyAxisParams(to);
	if (to === null) {
		return;
	}

	if (axis !== null) {
		moveAcceleration.value = axis.acceleration;
	}
	readTuningConstants(to);
});

// A cached driver can outlive the board it belongs to, but an empty list only means the machine is not connected yet
watch(drivers, (to) => {
	if (to.length > 0 && selectedDriver.value !== null && !to.some((driver) => driver.value === selectedDriver.value)) {
		selectedDriver.value = null;
	}
});

watch(canStepManoeuvre, (to) => {
	if (!to) {
		calibrationMovement.value = CustomGCode;
	}
});

watch(calibrationMovement, () => {
	activateMode.value = 0;
});

watch(() => closedLoopBoard.value?.points, (to) => {
	if (recordingProgress.value !== null && to !== undefined) {
		recordingProgress.value = (to / sampleCount.value) * 100;
	}
});

// Selecting another driver also changes the run counter in view, which is not a finished recording
watch(() => closedLoopBoard.value?.runs, (to, from) => {
	if (to !== undefined && from !== undefined) {
		recordingProgress.value = null;
		emit("recordingFinished");
	}
});

// #endregion
</script>
