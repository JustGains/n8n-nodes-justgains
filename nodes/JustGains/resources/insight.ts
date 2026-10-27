import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, dateOnly, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['insight'], operation } });

const endDateOption: INodeProperties = {
	displayName: 'End Date',
	name: 'endDate',
	type: 'dateTime',
	default: '',
	description: 'Look back from this date instead of today',
};

export const insightDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['insight'] } },
		options: [
			{
				name: 'Compare Weeks',
				value: 'compareWeeks',
				description: 'Compare your latest training window with the one before it',
				action: 'Compare training weeks',
			},
			{
				name: 'Get Consistency',
				value: 'getConsistency',
				description: 'Get your current and longest streaks and workouts per week',
				action: 'Get training consistency',
			},
			{
				name: 'Get Progress',
				value: 'getProgress',
				description: 'Get XP, workout volume, steps and active days over a period',
				action: 'Get progress',
			},
			{
				name: 'Get Recovery',
				value: 'getRecovery',
				description: 'Get weekly set targets and recovery for each muscle group',
				action: 'Get muscle recovery',
			},
			{
				name: 'Get Week Summary',
				value: 'getWeekSummary',
				description: 'Get a recap of recent workouts, muscle groups and bodyweight change',
				action: 'Get week summary',
			},
		],
		default: 'getWeekSummary',
	},
	{
		displayName: 'Options',
		name: 'progressOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getProgress']),
		options: [
			{
				displayName: 'Days',
				name: 'days',
				type: 'number',
				typeOptions: { minValue: 1 },
				default: 30,
				description: 'How many recent days to include, instead of a start date',
			},
			endDateOption,
			{
				displayName: 'Start Date',
				name: 'startDate',
				type: 'dateTime',
				default: '',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'recoveryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getRecovery']),
		options: [
			{
				displayName: 'As Of',
				name: 'asOfDate',
				type: 'dateTime',
				default: '',
				description: 'Work out recovery as if it were this date',
			},
		],
	},
	{
		displayName: 'Options',
		name: 'weekOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getWeekSummary']),
		options: [
			{
				displayName: 'Days',
				name: 'days',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 60 },
				default: 7,
				description: 'How many days to look back',
			},
			endDateOption,
		],
	},
	{
		displayName: 'Options',
		name: 'consistencyOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getConsistency']),
		options: [
			{
				displayName: 'Days',
				name: 'days',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 365 },
				default: 60,
				description: 'How many days to look back',
			},
			endDateOption,
		],
	},
	{
		displayName: 'Options',
		name: 'compareOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['compareWeeks']),
		options: [
			endDateOption,
			{
				displayName: 'Window Days',
				name: 'windowDays',
				type: 'number',
				typeOptions: { minValue: 1, maxValue: 30 },
				default: 7,
				description: 'Length of each window being compared',
			},
		],
	},
];

export const insightCalls: ResourceCalls = {
	getProgress: {
		tool: 'get_progress',
		args(i) {
			const options = this.getNodeParameter('progressOptions', i, {}) as IDataObject;

			return compact({
				days: options.days,
				startDate: dateOnly(options.startDate),
				endDate: dateOnly(options.endDate),
			});
		},
	},
	getRecovery: {
		tool: 'get_my_recovery_analytics',
		args(i) {
			return compact(this.getNodeParameter('recoveryOptions', i, {}) as IDataObject);
		},
	},
	getWeekSummary: {
		tool: 'summarize_my_week',
		args(i) {
			return compact(this.getNodeParameter('weekOptions', i, {}) as IDataObject);
		},
	},
	getConsistency: {
		tool: 'analyze_my_consistency',
		args(i) {
			return compact(this.getNodeParameter('consistencyOptions', i, {}) as IDataObject);
		},
	},
	compareWeeks: {
		tool: 'compare_my_weeks',
		args(i) {
			return compact(this.getNodeParameter('compareOptions', i, {}) as IDataObject);
		},
	},
};
