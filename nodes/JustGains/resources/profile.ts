import type { IDataObject, INodeProperties } from 'n8n-workflow';
import { compact, listParameter, type ResourceCalls } from '../transport';

const show = (operation: string[]) => ({ show: { resource: ['profile'], operation } });

export const profileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['profile'] } },
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get your profile, units, timezone, goals and body details',
				action: 'Get profile',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Change profile fields; anything you leave out stays as it is',
				action: 'Update profile',
			},
		],
		default: 'get',
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
				displayName: 'Auto-Stop Idle Workouts After (Seconds)',
				name: 'autoStopAbandonedWorkoutsSeconds',
				type: 'number',
				typeOptions: { minValue: 0, maxValue: 86400 },
				default: 0,
			},
			{
				displayName: 'Bio',
				name: 'bio',
				type: 'string',
				typeOptions: { rows: 3 },
				default: '',
				description: 'Public bio, up to 500 characters',
			},
			{
				displayName: 'Birth Date',
				name: 'birthDate',
				type: 'dateTime',
				default: '',
			},
			{
				displayName: 'Experience Level',
				name: 'experienceLevel',
				type: 'options',
				options: [
					{ name: 'Beginner', value: 'Beginner' },
					{ name: 'Intermediate', value: 'Intermediate' },
					{ name: 'Advanced', value: 'Advanced' },
				],
				default: 'Beginner',
			},
			{
				displayName: 'Fitness Goals',
				name: 'fitnessGoals',
				type: 'string',
				default: '',
				placeholder: 'e.g. Build muscle, Get stronger',
				description: 'Comma-separated goals. Replaces your current goals.',
			},
			{
				displayName: 'Gender',
				name: 'gender',
				type: 'options',
				options: [
					{ name: 'Female', value: 'Female' },
					{ name: 'FTM', value: 'FTM' },
					{ name: 'Male', value: 'Male' },
					{ name: 'MTF', value: 'MTF' },
				],
				default: 'Female',
			},
			{
				displayName: 'Height (Cm)',
				name: 'heightCm',
				type: 'number',
				typeOptions: { minValue: 0 },
				default: 0,
			},
			{
				displayName: 'Timezone',
				name: 'userTimezone',
				type: 'string',
				default: '',
				placeholder: 'e.g. America/New_York',
				description: 'IANA timezone name',
			},
			{
				displayName: 'Units',
				name: 'measurementSystem',
				type: 'options',
				options: [
					{ name: 'Imperial (Lb, Mi)', value: 'imperial' },
					{ name: 'Metric (Kg, Km)', value: 'metric' },
				],
				default: 'imperial',
			},
		],
	},
];

const PRIVATE_FIELDS = ['birthDate', 'heightCm', 'gender', 'experienceLevel', 'fitnessGoals'];

export const profileCalls: ResourceCalls = {
	get: {
		tool: 'get_my_profile',
		args() {
			return {};
		},
	},
	update: {
		tool: 'update_my_profile',
		args(i) {
			const fields = this.getNodeParameter('updateFields', i, {}) as IDataObject;
			const privateMeta = compact({
				birthDate: fields.birthDate,
				heightCm: fields.heightCm,
				gender: fields.gender,
				experienceLevel: fields.experienceLevel,
				fitnessGoals:
					fields.fitnessGoals === undefined ? undefined : listParameter(fields.fitnessGoals),
			});
			const topLevel = Object.fromEntries(
				Object.entries(fields).filter(([key]) => !PRIVATE_FIELDS.includes(key)),
			);

			return compact({
				...topLevel,
				privateMeta: Object.keys(privateMeta).length ? privateMeta : undefined,
			});
		},
	},
};
