import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['program'], operation } });

export const programDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['program'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Build a multi-week program from plain text and save it',
				action: 'Create a program',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a program with its weeks and days',
				action: 'Get a program',
			},
			{
				name: 'Get Enrolled',
				value: 'getEnrolled',
				description: 'Get the programs you follow and your progress through them',
				action: 'Get your programs',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search the JustGains program catalog',
				action: 'Search programs',
			},
			{
				name: 'Update Enrollment',
				value: 'updateEnrollment',
				description: 'Start, complete or abandon a program',
				action: 'Update your enrollment in a program',
			},
		],
		default: 'search',
	},
	{
		displayName: 'Program Text',
		name: 'programText',
		type: 'string',
		typeOptions: { rows: 10 },
		required: true,
		default: '',
		placeholder:
			'Strength Base\nWeek 1, Day 1 Push: Barbell Bench Press 5x5, Overhead Press 3x8\nWeek 1, Day 2 Pull: ...',
		displayOptions: show(['create']),
		description:
			'The full program as plain text: a title line, then each week and day with its exercises and sets x reps (add weight or RPE where you like)',
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
				displayName: 'Title',
				name: 'programTitle',
				type: 'string',
				default: '',
				description: 'A title for the program. Taken from the text when empty.',
			},
		],
	},
	{
		displayName: 'Program ID',
		name: 'workoutProgramId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: show(['get', 'updateEnrollment']),
		description: 'The ID of the program',
	},
	{
		displayName: 'Include Weeks and Days',
		name: 'includeData',
		type: 'boolean',
		default: true,
		displayOptions: show(['get']),
		description: 'Whether to include the full week and day breakdown',
	},
	{
		displayName: 'Action',
		name: 'action',
		type: 'options',
		required: true,
		options: [
			{ name: 'Start', value: 'start' },
			{ name: 'Complete', value: 'complete' },
			{ name: 'Abandon', value: 'abandon' },
		],
		default: 'start',
		displayOptions: show(['updateEnrollment']),
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 50,
		displayOptions: show(['search']),
		description: 'Max number of results to return',
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: show(['search']),
		options: [
			{
				displayName: 'Creator Profile ID',
				name: 'creatorId',
				type: 'string',
				default: '',
				description: 'Only return programs by this creator',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
			},
			{
				displayName: 'Search',
				name: 'search',
				type: 'string',
				default: '',
				placeholder: 'e.g. hypertrophy',
				description: 'Keyword to match in program titles and descriptions',
			},
		],
	},
];

export const programCalls: ResourceCalls = {
	search: {
		tool: 'search_workout_programs',
		listKey: 'programs',
		args(i) {
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

			return compact({ pageSize: this.getNodeParameter('limit', i) as number, ...filters });
		},
	},
	get: {
		tool: 'get_workout_program',
		args(i) {
			return {
				workoutProgramId: this.getNodeParameter('workoutProgramId', i) as string,
				includeData: this.getNodeParameter('includeData', i) as boolean,
			};
		},
	},
	getEnrolled: {
		tool: 'get_my_workout_programs',
		listKey: 'programs',
		args() {
			return {};
		},
	},
	create: {
		tool: 'create_workout_program',
		args(i) {
			const fields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			return compact({
				programText: this.getNodeParameter('programText', i) as string,
				programTitle: fields.programTitle,
			});
		},
	},
	updateEnrollment: {
		tool: 'set_my_program_engagement',
		args(i) {
			return {
				workoutProgramId: this.getNodeParameter('workoutProgramId', i) as string,
				action: this.getNodeParameter('action', i) as string,
			};
		},
	},
};
