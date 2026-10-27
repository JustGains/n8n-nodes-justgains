import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['route'], operation } });

const KM_PER_MILE = 1.609344;

export const routeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['route'] } },
		options: [
			{
				name: 'Create',
				value: 'create',
				description: 'Plan a road and path route and save it to your Routes',
				action: 'Create a route',
			},
		],
		default: 'create',
	},
	{
		displayName: 'Activity',
		name: 'activityType',
		type: 'options',
		required: true,
		options: [
			{ name: 'Hike', value: 'hike' },
			{ name: 'Ride', value: 'ride' },
			{ name: 'Run', value: 'run' },
			{ name: 'Walk', value: 'walk' },
		],
		default: 'run',
		displayOptions: show(['create']),
		description: 'Rides follow cycling roads; the others follow walking and running paths',
	},
	{
		displayName: 'Distance',
		name: 'distance',
		type: 'number',
		typeOptions: { minValue: 0.3, numberPrecision: 2 },
		required: true,
		default: 3.1,
		displayOptions: show(['create']),
		description: 'Target distance, between 0.5 km (0.3 mi) and 200 km (124 mi)',
	},
	{
		displayName: 'Distance Unit',
		name: 'distanceUnit',
		type: 'options',
		options: [
			{ name: 'Miles', value: 'mi' },
			{ name: 'Kilometers', value: 'km' },
		],
		default: 'mi',
		displayOptions: show(['create']),
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
				displayName: 'Direction',
				name: 'direction',
				type: 'options',
				options: [
					{ name: 'East', value: 'east' },
					{ name: 'North', value: 'north' },
					{ name: 'Northeast', value: 'northeast' },
					{ name: 'Northwest', value: 'northwest' },
					{ name: 'South', value: 'south' },
					{ name: 'Southeast', value: 'southeast' },
					{ name: 'Southwest', value: 'southwest' },
					{ name: 'West', value: 'west' },
				],
				default: 'north',
				description: 'Compass direction to head in. A sensible one is picked when empty.',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'e.g. 5K Morning Loop',
			},
			{
				displayName: 'Shape',
				name: 'routeShape',
				type: 'options',
				options: [
					{ name: 'Loop', value: 'loop' },
					{ name: 'Out and Back', value: 'out_and_back' },
				],
				default: 'loop',
			},
			{
				displayName: 'Start Latitude',
				name: 'startLat',
				type: 'number',
				typeOptions: { numberPrecision: 6 },
				default: 0,
				description: 'Where to start. Defaults to your last known training location.',
			},
			{
				displayName: 'Start Longitude',
				name: 'startLng',
				type: 'number',
				typeOptions: { numberPrecision: 6 },
				default: 0,
				description: 'Where to start. Defaults to your last known training location.',
			},
		],
	},
];

export const routeCalls: ResourceCalls = {
	create: {
		tool: 'create_route',
		args(i) {
			const distance = this.getNodeParameter('distance', i) as number;
			const unit = this.getNodeParameter('distanceUnit', i) as string;
			const fields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
			const distanceKm = unit === 'mi' ? distance * KM_PER_MILE : distance;

			return compact({
				activityType: this.getNodeParameter('activityType', i) as string,
				distanceKm: Math.round(distanceKm * 100) / 100,
				...fields,
			});
		},
	},
};
