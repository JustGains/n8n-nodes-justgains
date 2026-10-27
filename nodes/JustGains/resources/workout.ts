import type { IDataObject, INodeProperties } from 'n8n-workflow';
import {
	compact,
	jsonParameter,
	listParameter,
	parseJson,
	type ResourceCalls,
} from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['workout'], operation } });

const exercisesExample = JSON.stringify(
	[
		{
			exercise: 'Barbell Bench Press',
			sets: [
				{ reps: 8, weight: 135, unit: 'lb', type: 'warmup' },
				{ reps: 5, weight: 185, unit: 'lb' },
				{ reps: 5, weight: 185, unit: 'lb' },
			],
		},
		{ exercise: 'Pull Up', sets: [{ reps: 10 }, { reps: 8 }], notes: 'Slow negatives' },
	],
	null,
	2,
);

const exerciseFormat =
	'Each one names an exercise (a code from Exercise > Search, or a name to match) and can list sets with reps, weight, unit ("lb" or "kg"), rpe, durationSeconds, distance, distanceUnit and type (normal, warmup, dropset, myorep or failure).';

const exercisesDescription = `Ordered exercises. ${exerciseFormat}`;

const replaceExercisesDescription = `Replaces the whole exercise list. ${exerciseFormat}`;

export const workoutDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['workout'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Save a workout you describe exercise by exercise',
				action: 'Create workout',
			},
			{
				name: 'Generate',
				value: 'generate',
				description: 'Generate and save a workout from a plain-language request',
				action: 'Generate workout',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a workout with its exercises and sets',
				action: 'Get workout',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Change a workout title, description or exercises',
				action: 'Update workout',
			},
		],
		default: 'generate',
	},
	{
		displayName: 'Request',
		name: 'prompt',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. 30 minute leg workout with dumbbells',
		displayOptions: show(['generate']),
		description: 'Describe the workout to generate',
	},
	{
		displayName: 'Options',
		name: 'generateOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['generate']),
		options: [
			{
				displayName: 'Equipment',
				name: 'equipment',
				type: 'string',
				default: '',
				placeholder: 'e.g. DUMBBELL, BENCH',
				description: 'Comma-separated equipment codes that are available',
			},
			{
				displayName: 'Muscle Groups',
				name: 'muscleGroups',
				type: 'string',
				default: '',
				placeholder: 'e.g. QUADS, GLUTES',
				description: 'Comma-separated muscle group codes to focus on',
			},
		],
	},
	{
		displayName: 'Workout ID',
		name: 'workoutId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['get', 'update']),
		description: 'The ID of the workout',
	},
	{
		displayName: 'Title',
		name: 'title',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['create']),
	},
	{
		displayName: 'Exercises',
		name: 'exercises',
		type: 'json',
		required: true,
		default: exercisesExample,
		displayOptions: show(['create']),
		description: exercisesDescription,
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['create']),
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['update']),
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
			},
			{
				displayName: 'Exercises',
				name: 'exercises',
				type: 'json',
				default: exercisesExample,
				description: replaceExercisesDescription,
			},
			{
				displayName: 'Title',
				name: 'title',
				type: 'string',
				default: '',
			},
		],
	},
];

export const workoutCalls: ResourceCalls = {
	generate: {
		tool: 'generate_workout',
		args(i) {
			const options = this.getNodeParameter('generateOptions', i, {}) as IDataObject;
			const muscleGroups = listParameter(options.muscleGroups);
			const equipment = listParameter(options.equipment);

			return {
				prompt: this.getNodeParameter('prompt', i) as string,
				...(muscleGroups.length ? { muscleGroups } : {}),
				...(equipment.length ? { equipment } : {}),
			};
		},
	},
	create: {
		tool: 'create_workout',
		args(i) {
			const fields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			return compact({
				title: this.getNodeParameter('title', i) as string,
				description: fields.description,
				exercises: jsonParameter.call(this, 'exercises', 'Exercises', i),
			});
		},
	},
	get: {
		tool: 'show_workout',
		args(i) {
			return { workoutId: this.getNodeParameter('workoutId', i) as string };
		},
	},
	update: {
		tool: 'update_workout',
		args(i) {
			const fields = this.getNodeParameter('updateFields', i, {}) as IDataObject;

			return compact({
				workoutId: this.getNodeParameter('workoutId', i) as string,
				title: fields.title,
				description: fields.description,
				exercises:
					fields.exercises === undefined
						? undefined
						: parseJson.call(this, fields.exercises, 'Exercises', i),
			});
		},
	},
};
