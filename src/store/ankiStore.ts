import { create } from 'zustand';
import { CardFieldMapping } from '../types/card';
import { testConnection, getDeckNames, getModelNames, getModelFieldNames } from '../services/ankiConnect';

const ANKI_SETTINGS_KEY = 'anki_settings';
const RECONNECT_INTERVAL = 5000; // 5秒重试一次

interface AnkiSettings {
    deckName: string;
    modelName: string;
    fieldMapping: CardFieldMapping;
}

interface AnkiState {
    isConnected: boolean;
    deckName: string;
    modelName: string;
    fieldMapping: CardFieldMapping;
    setAnkiSettings: (settings: AnkiSettings) => void;
    setIsConnected: (isConnected: boolean) => void;
    loadSavedSettings: () => void;
    saveSettings: () => void;
    startAutoConnect: () => void;
    stopAutoConnect: () => void;
}

// 从 localStorage 加载保存的设置
const loadSettings = (): Partial<AnkiSettings> => {
    try {
        const savedSettings = localStorage.getItem(ANKI_SETTINGS_KEY);
        return savedSettings ? JSON.parse(savedSettings) : {};
    } catch (error) {
        console.error('Failed to load Anki settings:', error);
        return {};
    }
};

// 获取初始状态
const getInitialState = () => {
    const savedSettings = loadSettings();
    return {
        deckName: savedSettings.deckName || '',
        modelName: savedSettings.modelName || '',
        fieldMapping: savedSettings.fieldMapping || {},
    };
};

const useAnkiStore = create<AnkiState>((set, get) => {
    const initialState = getInitialState();
    let reconnectTimer: number | null = null;
    
    const startReconnectTimer = () => {
        if (reconnectTimer) return;
        
        reconnectTimer = setInterval(async () => {
            if (!get().isConnected) {
                try {
                    const connected = await testConnection();
                    if (connected) {
                        set({ isConnected: true });
                        stopReconnectTimer();
                    }
                } catch (error) {
                    console.log('Retrying Anki connection...');
                }
            }
        }, RECONNECT_INTERVAL);
    };
    
    const stopReconnectTimer = () => {
        if (reconnectTimer) {
            clearInterval(reconnectTimer);
            reconnectTimer = null;
        }
    };
    
    return {
        isConnected: false,
        ...initialState,
        setAnkiSettings: (settings: AnkiSettings) => {
            set(settings);
        },
        setIsConnected: (isConnected: boolean) => {
            set({ isConnected });
            if (!isConnected) {
                startReconnectTimer();
            }
        },
        loadSavedSettings: () => {
            const savedSettings = loadSettings();
            set(savedSettings);
        },
        saveSettings: () => {
            const { deckName, modelName, fieldMapping } = get();
            const settings: AnkiSettings = {
                deckName,
                modelName,
                fieldMapping,
            };
            try {
                localStorage.setItem(ANKI_SETTINGS_KEY, JSON.stringify(settings));
            } catch (error) {
                console.error('Failed to save Anki settings:', error);
            }
        },
        startAutoConnect: () => {
            startReconnectTimer();
        },
        stopAutoConnect: () => {
            stopReconnectTimer();
        },
    };
});

export default useAnkiStore; 