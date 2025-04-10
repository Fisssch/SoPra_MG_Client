import { getWebSocketDomain } from '@/utils/domain';
import { Client } from '@stomp/stompjs';

export class webSocketService {
	private static client: Client = new Client();

	public async connect() {
		const websocketUrl = getWebSocketDomain();
		webSocketService.client ??= new Client();
		webSocketService.client.configure({
			brokerURL: websocketUrl,
			onWebSocketError: this.onError,
			onStompError: this.onError,
		});
		webSocketService.client.activate();
		let i = 0;
		while (!webSocketService.client.connected) {
			if (i++ > 30) throw new Error('Could not connect to websocket');
			await new Promise(resolve => setTimeout(resolve, 1000));
		}
		console.log('Connected to websocket');
	}

	public async subscribe(destination: string, callback: (message: any) => void) {
		if (!webSocketService.client.connected) {
			await this.connect();
		}
		webSocketService.client.subscribe(destination, message => {
			try {
				callback(JSON.parse(message.body));
			} catch (e) {
				console.log('Error during websocket response parse:\n' + e);
				callback(message.body);
			}
		});
	}

	public onError(error: any) {
		console.log('error', error);
	}

	public async disconnect() {
		if (webSocketService.client) {
			await webSocketService.client.deactivate();
		}
	}
}
