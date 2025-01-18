declare module 'lamejs' {
    export enum MPEGMode {
        STEREO = 0,
        JOINT_STEREO = 1,
        DUAL_CHANNEL = 2,
        MONO = 3
    }

    export class Mp3Encoder {
        constructor(channels: number, sampleRate: number, kbps: number, mode?: MPEGMode);
        encodeBuffer(buffer: Int16Array): Uint8Array;
        flush(): Uint8Array;
    }
} 