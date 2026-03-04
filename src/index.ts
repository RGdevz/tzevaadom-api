import WebSocket from 'ws';
import Emittery from 'emittery';



const WS_URL = 'wss://ws.tzevaadom.co.il/socket?platform=WEB';
const HEADERS = { Origin: 'https://www.tzevaadom.co.il' };
const MAX_DELAY = 10_000;

// ── Types ────────────────────────────────────────────────────────────────────

export interface AlertData {
  notificationId: string;
  time: number;
  threat: number;
  isDrill: boolean;
  cities: string[];
}

export interface ListsVersionsData {
  [key: string]: unknown;
}

export interface SystemMessageData {
  id: number;
  time: string;
  titleHe: string;
  titleAr: string;
  titleEn: string;
  titleEs: string;
  titleRu: string;
  bodyHe: string;
  bodyAr: string;
  bodyEn: string;
  bodyEs: string;
  bodyRu: string;
  forIos: boolean;
  forAndroid: boolean;
  display: boolean;
  untilVersionIos: string | null;
  untilVersionAndroid: string | null;
  instruction: boolean;
  areasIds: number[];
  citiesIds: number[];
  instructionType: number;
  pinUntil: string | null;
  notificationId: string;
  instructionReadingDescName: string;
}

type EventMap = {
  ALERT: AlertData;
  LISTS_VERSIONS: ListsVersionsData;
  SYSTEM_MESSAGE: SystemMessageData;
  connected: undefined;
  disconnected: undefined;
  error: Error;
};

type MessageEventName = 'ALERT' | 'LISTS_VERSIONS' | 'SYSTEM_MESSAGE';

interface IncomingMessage<T extends MessageEventName = MessageEventName> {
  type: T;
  data: EventMap[T];
}

// ── Client ───────────────────────────────────────────────────────────────────

class TzevaadomClient extends Emittery<EventMap> {
  private attempt = 0;
  private ws: WebSocket | null = null;

  constructor() {
    super();
    this.connect();
  }

  private connect(): void {
    this.ws = new WebSocket(WS_URL, { headers: HEADERS });

    this.ws.on('open', () => {
      this.attempt = 0;
      this.emit('connected', undefined);
    });

    this.ws.on('message', (raw: WebSocket.RawData) => {
      if (typeof raw !== 'string' && !Buffer.isBuffer(raw)) return;
      try {
        const { type, data } = JSON.parse(raw.toString()) as IncomingMessage;
        this.emit(type, data);
      } catch {
        // ignore malformed frames
      }
    });

    this.ws.on('error', (err: Error) => {
     console.error('ws error',err)
      this.emit('error', err);
    }
    );

    this.ws.on('close', (code: number) => {
     const delay = Math.min(1000 * 2 ** this.attempt++, MAX_DELAY);
     this.emit('disconnected', undefined);
     console.log(`Closed (${code}) — reconnecting in ${delay}ms...`);
     setTimeout(() => this.connect(), delay);
    }
   );
  }

  disconnect(): void {
    this.ws?.removeAllListeners();
    this.ws?.close();
    this.ws = null;
  }
}

export const createClient = () => new TzevaadomClient();


