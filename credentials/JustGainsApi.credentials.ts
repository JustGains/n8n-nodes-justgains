import type {
	IAuthenticateGeneric,
	ICredentialDataDecryptedObject,
	ICredentialTestRequest,
	ICredentialType,
	IHttpRequestHelper,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class JustGainsApi implements ICredentialType {
	name = 'justGainsApi';

	displayName = 'JustGains API';

	icon: Icon = {
		light: 'file:../nodes/JustGains/justgains.svg',
		dark: 'file:../nodes/JustGains/justgains.dark.svg',
	};

	documentationUrl = 'https://github.com/JustGains/n8n-nodes-justgains?tab=readme-ov-file#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description:
				'Create a key on justgains.com: open your profile, then Settings, then API Keys',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://justgains.com',
			description: 'Leave this as it is unless you run a JustGains development server',
		},
		{
			// Filled by preAuthentication: the key is exchanged for a short-lived access
			// token, and n8n exchanges it again whenever JustGains answers 401.
			displayName: 'Session Token',
			name: 'sessionToken',
			type: 'hidden',
			typeOptions: { expirable: true, password: true },
			default: '',
		},
	];

	async preAuthentication(this: IHttpRequestHelper, credentials: ICredentialDataDecryptedObject) {
		let response: { data?: { accessToken?: string } };
		try {
			response = (await this.helpers.httpRequest({
				method: 'POST',
				url: `${String(credentials.baseUrl).replace(/\/+$/, '')}/api-proxy/auth/api-key-session`,
				body: { apiKey: String(credentials.apiKey).trim() },
				json: true,
			})) as typeof response;
		} catch (error) {
			const status = (error as { response?: { status?: number }; httpCode?: string }).response
				?.status;
			if (status === 401 || (error as { httpCode?: string }).httpCode === '401') {
				throw new Error(
					'JustGains did not accept this API key. It may have been revoked: create a new one on justgains.com under Profile > Settings > API Keys.',
				);
			}

			throw error;
		}

		return { sessionToken: response.data?.accessToken ?? '' };
	}

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.sessionToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/+$/, "")}}',
			url: '/api-proxy/user',
		},
	};
}
