export interface AnkiDeck {
    name: string;
    id: number;
}

export interface AnkiNoteType {
    name: string;
    fields: string[];
}

export interface AnkiField {
    name: string;
    order: number;
}

export interface AnkiConnectResponse<T> {
    result: T;
    error: string | null;
} 