import { getWebSocketDomain } from '@/utils/domain';
import { Client, IFrame, StompSubscription } from '@stomp/stompjs';

export class webSocketService {
	private static instance: webSocketService;
	private static client: Client;
	private static subscriptionIds: Map<string, StompSubscription> = new Map();

	constructor() {
		if (webSocketService.instance) {
			return webSocketService.instance;
		}

		webSocketService.client = new Client();
		webSocketService.instance = this;
	}

	public async connect(retries: number = 0): Promise<void> {
		//new
		if (webSocketService.client && webSocketService.client.active) {
			await webSocketService.client.deactivate();
		}

		const websocketUrl = getWebSocketDomain();

		webSocketService.client.configure({
			brokerURL: websocketUrl,
			reconnectDelay: 5000,
			onWebSocketError: this.onError,
			onStompError: this.onStompError,
		});

		const connectedPromise = new Promise<void>((resolve, reject) => {
			webSocketService.client.onConnect = () => {
				console.log('Connected to websocket');
				resolve();
			};

			webSocketService.client.onStompError = (frame: IFrame) => {
				reject(new Error(`STOMP error: ${frame.headers['message']}`));
			};
		});

		//new
		setTimeout(() => {
			webSocketService.client.activate();
		}, 250); // Delay a bit to let server cleanup finish
		//new
		try {
			await connectedPromise;
		} catch (err) {
			console.warn(`WebSocket failed to connect (retry ${retries})`, err);

			if (retries < 10) {
				setTimeout(() => this.connect(retries + 1), 1000);
			} else {
				console.error('WebSocket failed after multiple retries.');
			}
		}
	}

	public async subscribe(destination: string, callback: (message: any) => void) {
		if (webSocketService.subscriptionIds.has(destination)) {
			// Already subscribed
			return;
		}

		if (!webSocketService.client.connected) {
			await this.connect();
		}

		const subscription = webSocketService.client.subscribe(destination, message => {
			try {
				callback(JSON.parse(message.body));
			} catch (e) {
				console.warn('WebSocket JSON parse error:', e);
				callback(message.body);
			}
		});

		webSocketService.subscriptionIds.set(destination, subscription);
	}

	public async unsubscribe(destination: string) {
		if (!webSocketService.subscriptionIds.has(destination)) {
			return;
		}

		if (webSocketService.client.connected) {
			const sub = webSocketService.subscriptionIds.get(destination);
			sub?.unsubscribe();
			webSocketService.subscriptionIds.delete(destination);
		}
	}
	public async disconnect() {
		if (webSocketService.client && webSocketService.client.active) {
			webSocketService.subscriptionIds?.clear();
			await webSocketService.client.deactivate();
		}
	}

	private onError(error: Event) {
		console.error('WebSocket error:', error);
	}

	private onStompError(frame: IFrame) {
		console.error('STOMP error:', frame.headers['message'], frame.body);
	}
}
