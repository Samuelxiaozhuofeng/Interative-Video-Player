export interface CardContent {
    word: string;
    sentence: string;
    explanation: string;
    audioBlob?: Blob;
    imageBlob?: Blob;
    timestamp: {
        start: number;
        end: number;
    };
}

export interface CardFieldMapping {
    word?: string;
    sentence?: string;
    explanation?: string;
    audio?: string;
    image?: string;
    [key: string]: string | undefined;
}

export interface AnkiCardConfig {
    deckName: string;
    modelName: string;
    fieldMapping: CardFieldMapping;
} 