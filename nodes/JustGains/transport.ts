import { createHash } from 'crypto';
import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError } from 'n8n-workflow';

/** How one node operation maps onto a JustGains connector tool. */
export interface ToolCall {
	/** The tool's name in the JustGains connector catalog (POST /mcp/tools/{tool}). */
	tool: string;
	/** Builds the tool's arguments from the node parameters of one item. */
	args: (this: IExecuteFunctions, itemIndex: number) => IDataObject;
	/** For list operations: the array in the result that is returned as separate items. */
	listKey?: string;
}

export type ResourceCalls = Record<string, ToolCall>;

/**
 * Runs a JustGains connector tool and returns its result. Tools that proxy the JustGains API
 * wrap their result in `{ success, data }`; that envelope is removed so every operation
 * returns the same shape whichever kind of tool serves it.
 */
export async function callTool(
	this: IExecuteFunctions,
	tool: string,
	args: IDataObject,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('justGainsApi', itemIndex);
	const options: IHttpRequestOptions = {
		method: 'POST',
		url: `${String(credentials.baseUrl).replace(/\/+$/, '')}/mcp/tools/${tool}`,
		headers: { 'Content-Type': 'application/json', 'X-JustGains-Client': 'n8n' },
		// Serialized, because n8n drops an empty object body and every tool needs a JSON
		// object, even tools that take no arguments.
		body: JSON.stringify(args),
		json: true,
	};

	let response: IDataObject;
	try {
		response = (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'justGainsApi',
			options,
		)) as IDataObject;
	} catch (error) {
		// The request helper has already wrapped the failure, keeping the response body in
		// context.data. Re-wrapping that error returns it unchanged, so build a new one from
		// the body to show JustGains' own explanation.
		const body = (error as NodeApiError).context?.data as IDataObject | undefined;
		if (body && typeof body === 'object') {
			throw new NodeApiError(this.getNode(), body as JsonObject, {
				message: failureMessage(body),
				httpCode: (error as NodeApiError).httpCode ?? undefined,
				itemIndex,
			});
		}

		throw new NodeApiError(this.getNode(), error as JsonObject, { itemIndex });
	}

	const data = response.data as IDataObject | null | undefined;
	if (data && typeof data === 'object' && data.success === true && 'data' in data) {
		return (data.data as IDataObject) ?? {};
	}

	return data ?? {};
}

function failureMessage(body: IDataObject): string {
	const data = body.data as IDataObject | null | undefined;
	const content = body.content as Array<{ text?: string }> | undefined;
	const candidates = [data?.error, data?.message, body.message, content?.[0]?.text];
	const message = candidates.find(value => typeof value === 'string' && value.trim() !== '');

	return (message as string | undefined) ?? 'JustGains could not complete the request';
}

/** Reads a JSON parameter that may arrive as text or as an already-parsed value. */
export function jsonParameter(
	this: IExecuteFunctions,
	name: string,
	itemIndex: number,
): IDataObject | IDataObject[] {
	return parseJson.call(this, this.getNodeParameter(name, itemIndex), name, itemIndex);
}

export function parseJson(
	this: IExecuteFunctions,
	value: unknown,
	name: string,
	itemIndex: number,
): IDataObject | IDataObject[] {
	if (typeof value !== 'string') return value as IDataObject | IDataObject[];

	try {
		return JSON.parse(value) as IDataObject | IDataObject[];
	} catch {
		throw new NodeOperationError(this.getNode(), `"${name}" is not valid JSON`, { itemIndex });
	}
}

/** Splits a comma-separated parameter into trimmed, non-empty values. */
export function listParameter(value: unknown): string[] {
	return String(value ?? '')
		.split(',')
		.map(entry => entry.trim())
		.filter(entry => entry !== '');
}

/** A date picker value as the YYYY-MM-DD day JustGains expects for diary-style dates. */
export function dateOnly(value: unknown): string | undefined {
	return value ? String(value).slice(0, 10) : undefined;
}

/** Removes options left empty, so the tool falls back to its own defaults. */
export function compact(values: IDataObject): IDataObject {
	return Object.fromEntries(
		Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null),
	);
}

/**
 * A request ID that stays the same when n8n retries the same item in the same execution, so a
 * retried "Log Food" cannot save the meal twice, but differs for every other item and run.
 */
export function stableRequestId(this: IExecuteFunctions, itemIndex: number): string {
	const hex = createHash('sha256')
		.update(`${this.getExecutionId()}:${this.getNode().id}:${itemIndex}`)
		.digest('hex');

	return [
		hex.slice(0, 8),
		hex.slice(8, 12),
		`4${hex.slice(13, 16)}`,
		`${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}`,
		hex.slice(20, 32),
	].join('-');
}
