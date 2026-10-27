import type { IDataObject, INodeProperties } from 'n8n-workflow';
import {
	compact,
	dateOnly,
	jsonParameter,
	stableRequestId,
	type ResourceCalls,
} from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['food'], operation } });

const itemsExample = JSON.stringify(
	[
		{
			name: 'Greek yogurt',
			brand: 'Fage',
			quantityGrams: 170,
			estimatedMacros: { kcal: 100, proteinG: 18, carbG: 6, fatG: 0 },
		},
		{
			name: 'Banana',
			servingQuantity: 1,
			servingUnit: 'medium',
			quantityGrams: 118,
			portionEstimated: true,
			estimatedMacros: { kcal: 105, proteinG: 1, carbG: 27, fatG: 0 },
		},
	],
	null,
	2,
);

const removeExample = JSON.stringify(
	[{ diaryEntryId: '00000000-0000-0000-0000-000000000000', expectedUpdatedAt: '2026-01-01T12:00:00Z' }],
	null,
	2,
);

export const foodDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['food'] } },
		options: [
			{
				name: 'Get Diary',
				value: 'getDiary',
				description: 'Get a day of your food diary with totals and targets',
				action: 'Get your food diary',
			},
			{
				name: 'Log',
				value: 'log',
				description: 'Log a meal of foods you ate',
				action: 'Log food',
			},
			{
				name: 'Remove',
				value: 'remove',
				description: 'Remove foods from your diary',
				action: 'Remove food',
			},
			{
				name: 'Search',
				value: 'search',
				description: 'Search the JustGains food catalog and your recent foods',
				action: 'Search foods',
			},
		],
		default: 'log',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. greek yogurt',
		displayOptions: show(['search']),
		description: 'The food to search for',
	},
	{
		displayName: 'Meal',
		name: 'mealSlot',
		type: 'options',
		required: true,
		options: [
			{ name: 'Breakfast', value: 'BREAKFAST' },
			{ name: 'Lunch', value: 'LUNCH' },
			{ name: 'Dinner', value: 'DINNER' },
			{ name: 'Snack', value: 'SNACK' },
		],
		default: 'BREAKFAST',
		displayOptions: show(['log']),
	},
	{
		displayName: 'Foods',
		name: 'items',
		type: 'json',
		required: true,
		default: itemsExample,
		displayOptions: show(['log']),
		description:
			'The foods in the meal. Each needs a name and estimatedMacros for the whole portion (kcal, proteinG, carbG, fatG), plus quantityGrams or servingQuantity and servingUnit. JustGains prefers reliable catalog nutrition and saves your estimate when it has none. To correct a saved entry, include its diaryEntryId and expectedUpdatedAt.',
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
				displayName: 'Diary Date',
				name: 'entryDate',
				type: 'dateTime',
				default: '',
				description: 'The diary day to log to. Defaults to today in your timezone.',
			},
			{
				displayName: 'Eaten At',
				name: 'loggedAt',
				type: 'dateTime',
				default: '',
				description: 'When the meal was eaten',
			},
			{
				displayName: 'Request ID',
				name: 'requestId',
				type: 'string',
				default: '',
				description:
					'A UUID for this meal. Sending the same ID again never logs the meal twice. When empty, one is made that stays the same if n8n retries the item.',
			},
		],
	},
	{
		displayName: 'Entries',
		name: 'entries',
		type: 'json',
		required: true,
		default: removeExample,
		displayOptions: show(['remove']),
		description:
			'The diary entries to remove, each with the diaryEntryId and expectedUpdatedAt from the latest Log or Get Diary result',
	},
	{
		displayName: 'Options',
		name: 'diaryOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: show(['getDiary']),
		options: [
			{
				displayName: 'Diary Date',
				name: 'entryDate',
				type: 'dateTime',
				default: '',
				description: 'The diary day to read. Defaults to today in your timezone.',
			},
		],
	},
];

export const foodCalls: ResourceCalls = {
	search: {
		tool: 'search_foods',
		args(i) {
			return { query: this.getNodeParameter('query', i) as string };
		},
	},
	log: {
		tool: 'log_my_food',
		args(i) {
			const fields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;

			return compact({
				requestId: (fields.requestId as string) || stableRequestId.call(this, i),
				mealSlot: this.getNodeParameter('mealSlot', i) as string,
				items: jsonParameter.call(this, 'items', i),
				entryDate: dateOnly(fields.entryDate),
				loggedAt: fields.loggedAt,
			});
		},
	},
	remove: {
		tool: 'remove_my_food',
		args(i) {
			return { items: jsonParameter.call(this, 'entries', i) };
		},
	},
	getDiary: {
		tool: 'get_my_food_diary',
		args(i) {
			const options = this.getNodeParameter('diaryOptions', i, {}) as IDataObject;

			return compact({ entryDate: dateOnly(options.entryDate) });
		},
	},
};
