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
	},
];

export let variables = [
	{
		id: "encoderReading",
		title: "Raw Encoder Reading",
		filterValue: 1,
		colour: "#000000",
		axis: "count"
	},
	{
		id: "currentMotorSteps",
		title: "Current Motor Steps",
		filterValue: 2,
		colour: "#34eb71",
		axis: "steps"
	},
	{
		id: "targetMotorSteps",
		title: "Target Motor Steps",
		filterValue: 4,
		colour: "#9aedb6",
		axis: "steps"
	},
	{
		id: "currentError",
		title: "Current Error",
		filterValue: 8,
		colour: "#9aedb6",
		axis: "steps"
	},
	{
		id: "pidControlSignal",
		title: "PID Control Signal",
		filterValue: 16,
		colour: "#de0000",
		axis: "unitless"
	},
	{
		id: "pidPTerm",
		title: "PID P Term",
		filterValue: 32,
		colour: "#de2f32",
		axis: "unitless"
	},
	{
		id: "pidITerm",
		title: "PID I Term",
		filterValue: 64,
		colour: "#de2f61",
		axis: "unitless"
	},
	{
		id: "pidDTerm",
		title: "PID D Term",
		filterValue: 128,
		colour: "#de2f89",
		axis: "unitless"
	},
	{
		id: "stepPhase",
		title: "Step Phase",
		filterValue: 256,
		colour: "#4452eb",
		filter: val => (val / 4095) * 360,
		axis: "degrees"
	},
	{
		id: "desiredStepPhase",
		title: "Desired Step Phase",
		filterValue: 512,
		colour: "#848de8",
		filter: val => (val / 4095) * 360,
		axis: "degrees"
	},
	{
		id: "phaseShift",
		title: "Phase Shift",
		filterValue: 1024,
		colour: "#c1c4e3",
		filter: val => (val / 4095) * 360,
		axis: "degrees"
	},
	{
		id: "coilACurrent",
		title: "Coil A Current",
		filterValue: 2048,
		colour: "#b8b8b8",
		axis: "unitless"
	},
	{
		id: "coilBCurrent",
		title: "Coil B Current",
		filterValue: 4096,
		colour: "#4d4d4d",
		axis: "unitless"
	}
];

export let tuningManoeuvres = [
	{
		name: "Polarity Detection",
		value: 1,
		disabled: false
	},
	{
		name: "Zeroing",
		value: 2,
		disabled: false
	},
	{
		name: "Polarity Check",
		value: 4,
		disabled: false
	},
	{
		name: "Control Check",
		value: 8,
		disabled: true
	},
	{
		name: "Encoder Steps Check",
		value: 16,
		disabled: true
	},
	{
		name: "Continuous Phase Increase",
		value: 32,
		disabled: true
	},
	{
		name: "Step Manoeuvre",
		value: 64,
		disabled: false
	},
	{
		name: "Ziegler Nichols Manoeuvre",
		value: 128,
		disabled: true
	}
]