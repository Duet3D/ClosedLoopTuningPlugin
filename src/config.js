export let yAxes = [
	{
		id: 'count',
		type: 'linear',
		position: 'left',
	},
	{
		id: 'steps',
		type: 'linear',
		position: 'left',
	},
	{
		id: 'degrees',
		type: 'linear',
		position: 'right',
	},
	{
		id: 'unitless',
		type: 'linear',
		position: 'right',
	}
];

export let variables = [
	{
		id: "encoderReading",
		title: "Raw Encoder Reading",
		filterValue: 1,
		colour: {
			light: "#b30000",
			dark: "#e60049"
		},
		axis: "count",
	},
	{
		id: "currentAndTarget",
		title: "Current and Target Position",
		filterValue: 14,
		colour: {
			light: "#7c1158",
			dark: "#0bb4ff"
		},
		axis: "steps",
		hideSelect: true,
	},
	{
		id: "currentMotorSteps",
		title: "Measured Motor Steps",
		filterValue: 2,
		colour: {
			light: "#7c1158",
			dark: "#0bb4ff"
		},
		axis: "steps",
		hideRecord: true,
	},

	{
		id: "targetMotorSteps",
		title: "Target Motor Steps",
		filterValue: 4,
		colour: {
			light: "#4421af",
			dark: "#50e991"
		},
		axis: "steps",
		hideRecord: true,
	},
	{
		id: "currentError",
		title: "Current Error",
		filterValue: 8,
		colour: {
			light: "#1a53ff",
			dark: "#e6d800"
		},
		axis: "steps",
		hideRecord: true,
	},
	{
		id: "pidControlSignal",
		title: "PID Control Signal",
		filterValue: 16,
		colour: {
			light: "#0d88e6",
			dark: "#9b19f5"
		},
		axis: "unitless"
	},
	{
		id: "pidPTerm",
		title: "PID P Term",
		filterValue: 32,
		colour: {
			light: "#00b7c7",
			dark: "#ffa300"
		},
		axis: "unitless"
	},
	{
		id: "pidITerm",
		title: "PID I Term",
		filterValue: 64,
		colour: {
			light: "#5ad45a",
			dark: "#dc0ab4"
		},
		axis: "unitless"
	},
	{
		id: "pidDTerm",
		title: "PID D Term",
		filterValue: 128,
		colour: {
			light: "#8be04e",
			dark: "#b3d4ff"
		},
		axis: "unitless"
	},
	{
		id: "pidVTerm",
		title: "PID V Term",
		filterValue: 1 << 13,
		colour: {
			light: "#ffa52a",
			dark: "#0549a7"
		},
		axis: "unitless"
	},
	{
		id: "pidATerm",
		title: "PID A Term",
		filterValue: 1 << 14,
		colour: {
			light: "#bf9004",
			dark: "#8938c9"
		},
		axis: "unitless"
	},	
	{
		id: "stepPhase",
		title: "Measured Step Phase",
		filterValue: 256,
		colour: {
			light: "#ebdc78",
			dark: "#00bfa0"
		},
		filter: val => (val / 4095) * 360,
		axis: "degrees"
	},
	{
		id: "desiredStepPhase",
		title: "Desired Step Phase",
		filterValue: 512,
		colour: {
			light: "#fd7f6f",
			dark: "#fd7f6f"
		},
		filter: val => (val / 4095) * 360,
		axis: "degrees"
	},
	{
		id: "phaseShift",
		title: "Phase Shift",
		filterValue: 1024,
		colour: {
			light: "#7eb0d5",
			dark: "#7eb0d5"
		},
		filter: val => (val / 4095) * 360,
		axis: "degrees"
	},
	{
		id: "motorCurrents",
		title: "Motor Currents",
		filterValue: 6144,
		colour: {
			light: "#b2e061",
			dark: "#b2e061"
		},
		axis: "unitless",
		hideSelect: true,
	},
	{
		id: "coilACurrent",
		title: "Coil A Current",
		filterValue: 2048,
		colour: {
			light: "#b2e061",
			dark: "#b2e061"
		},
		axis: "unitless",
		hideRecord: true,
	},
	{
		id: "coilBCurrent",
		title: "Coil B Current",
		filterValue: 4096,
		colour: {
			light: "#bd7ebe",
			dark: "#bd7ebe"
		},
		axis: "unitless",
		hideRecord: true,
	}
];

export let tuningManoeuvres = [
	{
		name: "Basic Tuning",
		value: 1,
		disabled: true
	},
	{
		name: "Encoder Calibration",
		value: 2,
		disabled: true
	},
	{
		name: "Step Manoeuvre",
		value: 64,
		disabled: false,
	},
]