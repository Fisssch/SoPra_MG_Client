import { getWebSocketDomain } from '@/utils/domain';
import { Client, IFrame } from '@stomp/stompjs';

export class webSocketService {
  private static instance: webSocketService;
  private static client: Client;
  private static subscriptions: Set<string> = new Set();

  constructor() {
    if (webSocketService.instance) {
      return webSocketService.instance;
    }

    webSocketService.client = new Client();
    webSocketService.instance = this;
  }

  public async connect() {
    if (webSocketService.client.active) return;

    const websocketUrl = getWebSocketDomain();

    webSocketService.client.configure({
      brokerURL: websocketUrl,
      reconnectDelay: 5000,
      onWebSocketError: this.onError,
      onStompError: this.onStompError,
    });

    webSocketService.client.activate();

    let i = 0;
    while (!webSocketService.client.connected) {
      if (i++ > 30) throw new Error('Could not connect to websocket');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('Connected to websocket');
  }

  public async subscribe(destination: string, callback: (message: any) => void) {
    if (webSocketService.subscriptions.has(destination)) return;
    webSocketService.subscriptions.add(destination);

    if (!webSocketService.client.connected) {
      await this.connect();
    }

    webSocketService.client.subscribe(destination, message => {
      try {
        callback(JSON.parse(message.body));
      } catch (e) {
        console.warn('WebSocket JSON parse error:', e);
        callback(message.body);
      }
    });
  }

  public async disconnect() {
    if (webSocketService.client && webSocketService.client.active) {
      webSocketService.subscriptions.clear();
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