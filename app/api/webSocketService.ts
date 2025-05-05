import { getWebSocketDomain } from '@/utils/domain';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';

export class webSocketService {
	private static instance: webSocketService;
	private static client: Client;
	private static subscriptionIds: Map<string, StompSubscription> = new Map();
	private unloading: boolean = false;
	private isConnecting: boolean = false;

	constructor() {
		if (webSocketService.instance) {
			return webSocketService.instance;
		}

		webSocketService.client = new Client();
		webSocketService.instance = this;

		if (typeof window !== "undefined") {
			window.addEventListener("beforeunload", () => {
				this.unloading = true;
			});
		}
	} 

	private waitUntilConnected(): Promise<void> {
		return new Promise((resolve) => {
			if (webSocketService.client.connected) {
				resolve();
			} else {
				const checkInterval = setInterval(() => {
					if (webSocketService.client.connected) {
						clearInterval(checkInterval);
						resolve();
					}
				}, 50);
			}
		});
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
			onWebSocketError: this.onError.bind(this),
			onStompError: this.onStompError.bind(this),
		});

		this.isConnecting = true; 

		const connectedPromise = new Promise<void>((resolve, reject) => {
			webSocketService.client.onConnect = () => {
				console.log('Connected to websocket');
				this.isConnecting = false; 
				resolve();
			};

			webSocketService.client.onStompError = (frame: IFrame) => {
				this.isConnecting = false; 
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

			this.isConnecting = false; 

			if (retries < 10 && !this.unloading) {
				const delay = 1000 * Math.pow(2, retries);
				setTimeout(() => this.connect(retries + 1), delay);
			} else {
				console.error('WebSocket failed after multiple retries.');
			}
		}
	}

	public async subscribe<T = any>(destination: string, callback: (message: T) => void) {
		if (webSocketService.subscriptionIds.has(destination)) {
			// Already subscribed
			return;
		}

		if (!webSocketService.client.connected && !this.isConnecting) {
			await this.connect();
		}

		await this.waitUntilConnected();

		const subscription = webSocketService.client.subscribe(destination, (message: IMessage) => {
			try {
				callback(JSON.parse(message.body));
			} catch (err) {
				console.warn('WebSocket JSON parse error:', err);
				callback(message.body as unknown as T);
			}
		});

		webSocketService.subscriptionIds.set(destination, subscription);
	}

	public async unsubscribe(destination: string) {
		if (!webSocketService.subscriptionIds.has(destination)) return;

		const subscription = webSocketService.subscriptionIds.get(destination);
		subscription?.unsubscribe();
		webSocketService.subscriptionIds.delete(destination);
	}


	public async disconnect() {
		if (webSocketService.client && webSocketService.client.active) {
			webSocketService.subscriptionIds?.clear();
			await webSocketService.client.deactivate();
		}
	}

	private onError(error: Event) {
		if (this.unloading) return;

		if (error instanceof CloseEvent) {
			console.error(`WebSocket closed: Code ${error.code}, Reason: ${error.reason}, Clean: ${error.wasClean}`);
		} else {
			console.error('WebSocket error event:', error.type);
		}
	}

	private onStompError(frame: IFrame) {
		console.error('STOMP error:', frame.headers['message'], frame.body);
	}
}
