import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['bodyweight'], operation } });

export const bodyweightDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['bodyweight'] } },
		options: [
			{
				name: 'Get History',
				value: 'getHistory',
				description: 'Get your bodyweight entries with your current, lowest and highest weight',
				action: 'Get your bodyweight history',
			},
			{
				name: 'Log',
				value: 'log',
				description: 'Record a bodyweight entry',
				action: 'Log your bodyweight',
			},
		],
		default: 'log',
	},
	{
		displayName: 'Weight',
		name: 'weight',
		type: 'number',
		typeOptions: { minValue: 0, numberPrecision: 2 },
		required: true,
		default: 0,
		displayOptions: show(['log']),
	},
	{
		displayName: 'Unit',
		name: 'unit',
		type: 'options',
		options: [
			{ name: 'Pounds', value: 'lb' },
			{ name: 'Kilograms', value: 'kg' },
		],
		default: 'lb',
		displayOptions: show(['log']),
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: show(['log']),
		options: [
			{
				displayName: 'Notes',
				name: 'notes',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Recorded At',
				name: 'recordedAt',
				type: 'dateTime',
				default: '',
				description: 'When the weight was measured. Defaults to now.',
			},
		],
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 200 },
		default: 50,
		displayOptions: show(['getHistory']),
		description: 'Max number of results to return',
	},
	{
		displayName: 'Options',
		name: 'options',
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
				description: 'Only include entries recorded at or after this time',
			},
			{
				displayName: 'Before',
				name: 'until',
				type: 'dateTime',
				default: '',
				description: 'Only include entries recorded at or before this time',
			},
		],
	},
];

export const bodyweightCalls: ResourceCalls = {
	log: {
		tool: 'log_my_weight',
		args(i) {
			const weight = this.getNodeParameter('weight', i) as number;
			const unit = this.getNodeParameter('unit', i) as string;
			const fields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			return compact({
				[unit === 'kg' ? 'weightKg' : 'weightLbs']: weight,
				recordedAt: fields.recordedAt,
				notes: fields.notes,
			});
		},
	},
	getHistory: {
		tool: 'get_my_weight_history',
		args(i) {
			const options = this.getNodeParameter('options', i, {}) as IDataObject;

			return compact({ limit: this.getNodeParameter('limit', i) as number, ...options });
		},
	},
};
