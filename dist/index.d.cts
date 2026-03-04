import Emittery from 'emittery';

interface AlertData {
    notificationId: string;
    time: number;
    threat: number;
    isDrill: boolean;
    cities: string[];
}
interface ListsVersionsData {
    [key: string]: unknown;
}
interface SystemMessageData {
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
declare class TzevaadomClient extends Emittery<EventMap> {
    private attempt;
    private ws;
    constructor();
    private connect;
    disconnect(): void;
}
declare const createClient: () => TzevaadomClient;

export { type AlertData, type ListsVersionsData, type SystemMessageData, createClient };
