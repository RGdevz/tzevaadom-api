import WebSocket from 'ws';
import Emittery from 'emittery';
import { LRUCache } from 'lru-cache';


function getThreatName(threat:number) {
  switch (threat) {
  case 0: return "Rockets";
  case 1: return "HazardousMaterials";
  case 2: return "Terrorists";
  case 3: return "Earthquake";
  case 4: return "Tsunami";
  case 5: return "UnmannedAircraft";
  case 6:
  case 7: return "NonConventionalMissile";
  default: return "GeneralAlert";
  }
 }



// ── Types ────────────────────────────────────────────────────────────────────

export type ThreatName =
  | "Rockets"
  | "HazardousMaterials"
  | "Terrorists"
  | "Earthquake"
  | "Tsunami"
  | "UnmannedAircraft"
  | "NonConventionalMissile"
  | "GeneralAlert"


export interface AlertData {
  notificationId: string;
  time: number;
  threatName: ThreatName;
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

const POLLING_URL = 'https://api.tzevaadom.co.il/notifications';
const DEFAULT_INTERVAL = 1_500;
const SEEN_IDS_MAX = 500;

//[{"notificationId":"95044756-a133-44ce-a488-285763efee26","time":1772792070,"threat":0,"isDrill":false,"cities":["נתיב העשרה"]}]


class TzevaadomPollingClient extends Emittery<EventMap> {
  private intervalMs: number;
  private timer: NodeJS.Timeout | null = null;
  private seenIds = new LRUCache<string, true>({ max: SEEN_IDS_MAX });
  private running = false;

  constructor(intervalMs = DEFAULT_INTERVAL) {
   super();
   this.intervalMs = intervalMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.emit('connected', undefined);
    this.scheduleNext();
  }


  stop(): void {
   this.running = false;
   if (this.timer) {
   clearTimeout(this.timer);
   this.timer = null;
   }
   this.emit('disconnected', undefined);
  }

   private scheduleNext(): void {
   this.timer = setTimeout(() => this.poll(), this.intervalMs);
   }


     private async poll(): Promise<void> {
     if (!this.running){
      return;
     }
     try {
      const res = await fetch(POLLING_URL, {
       headers: { Origin: 'https://www.tzevaadom.co.il' },
      }
     );

      if (!res.ok){
      throw new Error(`HTTP ${res.status}`);
      }
      const messages = (await res.json()) as {
       notificationId: string
       time: number
       threat: number
       isDrill: boolean
       threatName:ThreatName,
       cities: string[]
     }[]


      for (const msg of messages) {
      const id = msg.notificationId as string;

      if (id) {
      if (this.seenIds.has(id)){
       continue;
      }
      this.seenIds.set(id, true);
      }

    
       msg.threatName = getThreatName(msg.threat);

      this.emit('ALERT', msg);
      }

     } catch (err) {
     this.emit('error', err instanceof Error ? err : new Error(String(err)));
     }

    if (this.running) {
    this.scheduleNext();
    }
    }
    }






const WS_URL = 'wss://ws.tzevaadom.co.il/socket?platform=WEB';
const HEADERS = { Origin: 'https://www.tzevaadom.co.il' };
const MAX_DELAY = 10_000;
const CONNECTION_TIMEOUT = 10_000;

class TzevaadomWsClient extends Emittery<EventMap> {
  private attempt = 0;
  private ws: WebSocket | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.connect();
  }

  private clearConnectionTimeout(): void {
  if (this.connectionTimeout) {
   clearTimeout(this.connectionTimeout);
   this.connectionTimeout = null;
  }
  }



  private connect(): void {
    this.ws = new WebSocket(WS_URL, { headers: HEADERS });

    this.connectionTimeout = setTimeout(() => {
     console.log(`Connection timed out after ${CONNECTION_TIMEOUT}ms — terminating...`);
     this.emit('error',new Error(`Connection timed out after ${CONNECTION_TIMEOUT}ms — terminating...`))
     this.ws?.terminate();
    }, CONNECTION_TIMEOUT);

    this.ws.on('open', () => {
      this.clearConnectionTimeout();
      this.attempt = 0;
      this.emit('connected', undefined);
    }
    );

    this.ws.on('message', (raw: WebSocket.RawData) => {
      if (typeof raw !== 'string' && !Buffer.isBuffer(raw)) return;
      try {
      const { type, data } = JSON.parse(raw.toString()) as IncomingMessage;

      if (type === 'ALERT') {
       const casted = data as AlertData;
       casted.threatName = getThreatName(casted.threat);
      }

      this.emit(type, data);
     } catch {
       // ignore malformed frames
     }
    }
    );

    this.ws.on('error', (err: Error) => {
      console.error('ws error', err);
      this.emit('error', err);
    }
   );

    this.ws.on('close', (code: number) => {
     this.clearConnectionTimeout();
     const delay = Math.min(1000 * 2 ** this.attempt++, MAX_DELAY);
     this.emit('disconnected', undefined);
     console.log(`Closed (${code}) — reconnecting in ${delay}ms...`);
     setTimeout(() => this.connect(), delay);
    }
   );
   }

   disconnect(): void {
    this.clearConnectionTimeout();
    this.ws?.removeAllListeners();
    this.ws?.close();
    this.ws = null;
  }
 }


export const createWebSocketClient = () => new TzevaadomWsClient();

export const createPollingClient = (intervalMs?: number) => new TzevaadomPollingClient(intervalMs);

