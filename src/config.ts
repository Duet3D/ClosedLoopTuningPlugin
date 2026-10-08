/**
 * Y axis of the data chart. Variables sharing a unit share an axis so their traces stay comparable
 */
export interface ClosedLoopAxis {
	id: string;
	position: "left" | "right";
}

export const yAxes: Array<ClosedLoopAxis> = [
	{ id: "count", position: "left" },
	{ id: "steps", position: "left" },
	{ id: "degrees", position: "right" },
	{ id: "unitless", position: "right" }
];

/**
 * One value the firmware can record during a closed-loop data collection run
 */
export interface ClosedLoopVariable {
	id: string;

	/**
	 * CSV column heading the firmware writes for this value, which also serves as the chart label.
	 * It must match the firmware verbatim or the trace cannot be matched to a recorded file,
	 * see OpenDataCollectionFile in RepRapFirmware's ClosedLoop.cpp
	 */
	column: string;

	/**
	 * Bit in the M569.5 D parameter requesting this value
	 */
	filterValue: number;

	colour: { light: string, dark: string };
	axis: string;

	/**
	 * Aggregate that can be requested but has no column of its own, so it is not offered for plotting
	 */
	hideSelect?: boolean;

	/**
	 * Part of an aggregate request, so it is plotted but not offered for recording
	 */
	hideRecord?: boolean;

	/**
	 * Conversion from the raw firmware value to the unit of the assigned axis
	 */
	filter?: (value: number) => number;
}

const toDegrees = (value: number) => (value / 4095) * 360;

export const variables: Array<ClosedLoopVariable> = [
	{
		id: "encoderReading",
		column: "Raw Encoder Reading",
		filterValue: 1,
		colour: {
			light: "#b30000",
			dark: "#e60049"
		},
		axis: "count"
	},
	{
		id: "currentAndTarget",
		column: "Current and Target Position",
		filterValue: 14,
		colour: {
			light: "#7c1158",
			dark: "#0bb4ff"
		},
		axis: "steps",
		hideSelect: true
	},
	{
		id: "currentMotorSteps",
		column: "Measured Motor Steps",
		filterValue: 2,
		colour: {
			light: "#7c1158",
			dark: "#0bb4ff"
		},
		axis: "steps",
		hideRecord: true
	},
	{
		id: "targetMotorSteps",
		column: "Target Motor Steps",
		filterValue: 4,
		colour: {
			light: "#4421af",
			dark: "#50e991"
		},
		axis: "steps",
		hideRecord: true
	},
	{
		id: "currentError",
		column: "Current Error",
		filterValue: 8,
		colour: {
			light: "#1a53ff",
			dark: "#e6d800"
		},
		axis: "steps",
		hideRecord: true
	},
	{
		id: "pidControlSignal",
		column: "PID Control Signal",
		filterValue: 16,
		colour: {
			light: "#0d88e6",
			dark: "#9b19f5"
		},
		axis: "unitless"
	},
	{
		id: "pidPTerm",
		column: "PID P Term",
		filterValue: 32,
		colour: {
			light: "#00b7c7",
			dark: "#ffa300"
		},
		axis: "unitless"
	},
	{
		id: "pidITerm",
		column: "PID I Term",
		filterValue: 64,
		colour: {
			light: "#5ad45a",
			dark: "#dc0ab4"
		},
		axis: "unitless"
	},
	{
		id: "pidDTerm",
		column: "PID D Term",
		filterValue: 128,
		colour: {
			light: "#8be04e",
			dark: "#b3d4ff"
		},
		axis: "unitless"
	},
	{
		id: "pidVTerm",
		column: "PID V Term",
		filterValue: 1 << 13,
		colour: {
			light: "#ffa52a",
			dark: "#0549a7"
		},
		axis: "unitless"
	},
	{
		id: "pidATerm",
		column: "PID A Term",
		filterValue: 1 << 14,
		colour: {
			light: "#bf9004",
			dark: "#8938c9"
		},
		axis: "unitless"
	},
	{
		id: "stepPhase",
		column: "Measured Step Phase",
		filterValue: 256,
		colour: {
			light: "#ebdc78",
			dark: "#00bfa0"
		},
		filter: toDegrees,
		axis: "degrees"
	},
	{
		id: "desiredStepPhase",
		column: "Desired Step Phase",
		filterValue: 512,
		colour: {
			light: "#fd7f6f",
			dark: "#fd7f6f"
		},
		filter: toDegrees,
		axis: "degrees"
	},
	{
		id: "phaseShift",
		column: "Phase Shift",
		filterValue: 1024,
		colour: {
			light: "#7eb0d5",
			dark: "#7eb0d5"
		},
		filter: toDegrees,
		axis: "degrees"
	},
	{
		id: "motorCurrents",
		column: "Motor Currents",
		filterValue: 6144,
		colour: {
			light: "#b2e061",
			dark: "#b2e061"
		},
		axis: "unitless",
		hideSelect: true
	},
	{
		id: "coilACurrent",
		column: "Coil A Current",
		filterValue: 2048,
		colour: {
			light: "#b2e061",
			dark: "#b2e061"
		},
		axis: "unitless",
		hideRecord: true
	},
	{
		id: "coilBCurrent",
		column: "Coil B Current",
		filterValue: 4096,
		colour: {
			light: "#bd7ebe",
			dark: "#bd7ebe"
		},
		axis: "unitless",
		hideRecord: true
	}
];

/**
 * Movement the plugin performs while data is collected. Only the step manoeuvre is driven by the
 * firmware's own tuning machinery, custom G-code is sent by the plugin right after the M569.5
 */
export const StepManoeuvre = 64;
export const CustomGCode = 0;
