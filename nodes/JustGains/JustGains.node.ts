import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { bodyweightCalls, bodyweightDescription } from './resources/bodyweight';
import { exerciseCalls, exerciseDescription } from './resources/exercise';
import { foodCalls, foodDescription } from './resources/food';
import { insightCalls, insightDescription } from './resources/insight';
import { profileCalls, profileDescription } from './resources/profile';
import { programCalls, programDescription } from './resources/program';
import { routeCalls, routeDescription } from './resources/route';
import { workoutCalls, workoutDescription } from './resources/workout';
import { workoutLogCalls, workoutLogDescription } from './resources/workoutLog';
import { callTool, type ResourceCalls } from './transport';

const calls: Record<string, ResourceCalls> = {
	bodyweight: bodyweightCalls,
	exercise: exerciseCalls,
	food: foodCalls,
	insight: insightCalls,
	profile: profileCalls,
	program: programCalls,
	route: routeCalls,
	workout: workoutCalls,
	workoutLog: workoutLogCalls,
};

/**
 * Every operation runs one tool of the JustGains connector, the same tool surface that
 * JustGains offers Claude and ChatGPT. Programmatic style, because most operations reshape
 * their input (JSON lists, unit conversion, generated request IDs) and their output (the
 * API envelope, list results split into items).
 */
export class JustGains implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'JustGains',
		name: 'justGains',
		icon: { light: 'file:justgains.svg', dark: 'file:justgains.dark.svg' },
		group: ['transform'],
		version: [1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Log workouts, food and bodyweight and read your training data in JustGains',
		defaults: {
			name: 'JustGains',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'justGainsApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Bodyweight', value: 'bodyweight' },
					{ name: 'Exercise', value: 'exercise' },
					{ name: 'Food', value: 'food' },
					{ name: 'Insight', value: 'insight' },
					{ name: 'Profile', value: 'profile' },
					{ name: 'Program', value: 'program' },
					{ name: 'Route', value: 'route' },
					{ name: 'Workout', value: 'workout' },
					{ name: 'Workout Log', value: 'workoutLog' },
				],
				default: 'workout',
			},
			...bodyweightDescription,
			...exerciseDescription,
			...foodDescription,
			...insightDescription,
			...profileDescription,
			...programDescription,
			...routeDescription,
			...workoutDescription,
			...workoutLogDescription,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				const call = calls[resource]?.[operation];
				if (!call) {
					throw new NodeOperationError(
						this.getNode(),
						`The operation "${operation}" is not supported for "${resource}"`,
						{ itemIndex: i },
					);
				}

				const result = await callTool.call(this, call.tool, call.args.call(this, i), i);
				const list = call.listKey ? result[call.listKey] : undefined;
				const entries = Array.isArray(list) ? (list as IDataObject[]) : [result];

				for (const entry of entries) {
					returnData.push({ json: entry, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}

				// Both helpers throw n8n errors already; wrapping an n8n error returns it unchanged.
				if (error instanceof NodeApiError) {
					throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { itemIndex: i });
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
