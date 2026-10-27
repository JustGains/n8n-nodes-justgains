import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['exercise'], operation } });

export const exerciseDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['exercise'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get an exercise with instructions, equipment and muscles worked',
				action: 'Get an exercise',
			},
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get your logged sessions and personal best for one exercise',
				action: 'Get your history on an exercise',
			},
			{
				name: 'Get Top',
				value: 'getTop',
				description: 'Get your most frequent, heaviest and highest-volume exercises',
				action: 'Get your top exercises',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search the JustGains exercise library by name',
				action: 'Search exercises',
			},
		],
		default: 'search',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. romanian deadlift',
		displayOptions: show(['search']),
		description: 'Exercise name to search for',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 25 },
		// JustGains returns at most 25 matches, so the usual default of 50 cannot apply.
		// eslint-disable-next-line n8n-nodes-base/node-param-default-wrong-for-limit
		default: 25,
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
				displayName: 'Equipment',
				name: 'equipment',
				type: 'string',
				default: '',
				placeholder: 'e.g. DUMBBELL',
				description: 'Equipment code to filter by',
			},
			{
				displayName: 'Muscle Group',
				name: 'muscleGroup',
				type: 'string',
				default: '',
				placeholder: 'e.g. CHEST',
				description: 'Muscle group code to filter by',
			},
		],
	},
	{
		displayName: 'Exercise Code',
		name: 'exerciseCode',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. BARBELL-BENCH-PRESS',
		displayOptions: show(['get', 'getHistory']),
		description: 'The exercise code, as returned by Search',
	},
	{
		displayName: 'Options',
		name: 'historyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getHistory']),
		options: [
			{
				displayName: 'After',
				name: 'since',
				type: 'dateTime',
				default: '',
				description: 'Only include sessions completed at or after this time',
			},
			{
				displayName: 'Before',
				name: 'until',
				type: 'dateTime',
				default: '',
				description: 'Only include sessions completed at or before this time',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 1,
			},
			{
				displayName: 'Sessions Per Page',
				name: 'pageSize',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 50 },
				default: 10,
			},
		],
	},
	{
		displayName: 'Options',
		name: 'topOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getTop']),
		options: [
			{
				displayName: 'After',
				name: 'since',
				type: 'dateTime',
				default: '',
				description: 'Only count workouts logged at or after this time',
			},
			{
				displayName: 'Before',
				name: 'until',
				type: 'dateTime',
				default: '',
				description: 'Only count workouts logged at or before this time',
			},
			{
				displayName: 'Lookback Days',
				name: 'lookbackDays',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 1825 },
				default: 365,
				description: 'How far back to look when no dates are set',
			},
			{
				displayName: 'Top N',
				name: 'topN',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 25 },
				default: 5,
				description: 'How many exercises to return in each ranking',
			},
		],
	},
];

export const exerciseCalls: ResourceCalls = {
	search: {
		tool: 'search_exercises',
		listKey: 'exercises',
		args(i) {
			const filters = this.getNodeParameter('filters', i, {}) as IDataObject;

			return compact({
				query: this.getNodeParameter('query', i) as string,
				limit: this.getNodeParameter('limit', i) as number,
				muscleGroup: filters.muscleGroup,
				equipment: filters.equipment,
			});
		},
	},
	get: {
		tool: 'get_exercise_details',
		args(i) {
			return { exerciseCode: this.getNodeParameter('exerciseCode', i) as string };
		},
	},
	getHistory: {
		tool: 'get_my_exercise_history',
		args(i) {
			const options = this.getNodeParameter('historyOptions', i, {}) as IDataObject;

			return compact({
				exerciseCode: this.getNodeParameter('exerciseCode', i) as string,
				...options,
			});
		},
	},
	getTop: {
		tool: 'get_my_top_exercises',
		args(i) {
			return compact(this.getNodeParameter('topOptions', i, {}) as IDataObject);
		},
	},
};
