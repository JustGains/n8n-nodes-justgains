import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['workoutLog'], operation } });

export const workoutLogDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['workoutLog'] } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				description: 'Get workouts you logged, with their exercises and sets',
				action: 'Get many workout logs',
			},
			{
				name: 'Get Recent',
				value: 'getRecent',
				description: 'Get recent workouts with their totals: duration, volume, sets and reps',
				action: 'Get recent workout logs',
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 50 },
		default: 50,
		displayOptions: show(['getAll']),
		description: 'Max number of results to return',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 20 },
		// JustGains returns at most 20 recent workouts, so the usual default of 50 cannot apply.
		// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-limit
		default: 20,
		displayOptions: show(['getRecent']),
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getAll']),
		options: [
			{
				displayName: 'Logged After',
				name: 'since',
				type: 'dateTime',
				default: '',
				description: 'Only return workouts logged at or after this time',
			},
			{
				displayName: 'Logged Before',
				name: 'until',
				type: 'dateTime',
				default: '',
				description: 'Only return workouts logged at or before this time',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
				description: 'Page of results to return. Ignored when a date range is set.',
			},
			{
				displayName: 'Rank By',
				name: 'rankBy',
				type: 'options',
				options: [
					{ name: 'Most Recent', value: 'recent' },
					{ name: 'Total Volume', value: 'volume' },
					{ name: 'Duration', value: 'duration' },
				],
				default: 'recent',
				description: 'How to order the workouts',
			},
			{
				displayName: 'Top N',
				name: 'topN',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 25 },
				default: 5,
				description: 'When ranking by volume or duration, how many workouts to return',
			},
		],
	},
];

export const workoutLogCalls: ResourceCalls = {
	getAll: {
		tool: 'get_my_workout_logs',
		listKey: 'workoutLogs',
		args(i) {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			return compact({
				pageSize: this.getNodeParameter('limit', i) as number,
				page: options.page,
				since: options.since,
				until: options.until,
				rankBy: options.rankBy,
				topN: options.topN,
			});
		},
	},
	getRecent: {
		tool: 'get_workout_history',
		listKey: 'workouts',
		args(i) {
			return { limit: this.getNodeParameter('limit', i) as number };
		},
	},
};
