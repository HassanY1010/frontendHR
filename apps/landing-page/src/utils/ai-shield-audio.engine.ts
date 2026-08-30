/**
 * AI Shield Web Audio Telemetry Engine
 * =====================================
 * Browser-side acoustic signal processor using Web Audio API.
 * 
 * Extracts:
 * 1. RMS Energy / Decibel levels
 * 2. Voice Activity Detection (VAD)
 * 3. Continuous Silence duration measurement
 * 4. Dual Frequency Overlap / Background voice observation
 */

export interface AudioTelemetryResult {
    audioLevel: number;                // 0.0 to 1.0
    isSpeaking: boolean;               // VAD threshold passed
    silenceDurationSeconds: number;   // Continuous silence duration
    dualVoiceDetected: boolean;        // Frequency overlap marker
    secondaryConfidence: number;       // 0.0 to 1.0
}

export class AIShieldAudioEngine {
    private audioContext: AudioContext | null = null;
    private analyser: AnalyserNode | null = null;
    private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
    private lastSpeakingTime: number = Date.now();
    private silenceDuration: number = 0;
    private isRunning: boolean = false;

    public async initialize(stream: MediaStream): Promise<void> {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioCtx();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 512;
            this.analyser.smoothingTimeConstant = 0.8;

            this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
            this.mediaStreamSource.connect(this.analyser);

            this.lastSpeakingTime = Date.now();
            this.isRunning = true;
        } catch (err) {
            console.warn('[AIShield Audio Engine] AudioContext init failed:', err);
            this.isRunning = false;
        }
    }

    public sampleAudio(): AudioTelemetryResult {
        if (!this.isRunning || !this.analyser) {
            return {
                audioLevel: 0,
                isSpeaking: false,
                silenceDurationSeconds: 0,
                dualVoiceDetected: false,
                secondaryConfidence: 0
            };
        }

        const bufferLength = this.analyser.frequencyBinCount;
        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(bufferLength);

        this.analyser.getByteTimeDomainData(timeData);
        this.analyser.getByteFrequencyData(freqData);

        // 1. Calculate RMS Energy (0.0 to 1.0)
        let sumSquares = 0;
        for (let i = 0; i < bufferLength; i++) {
            const normalized = (timeData[i] - 128) / 128;
            sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);
        const audioLevel = Math.min(1, rms * 4); // Scaled for clarity

        // 2. VAD: Speech Threshold
        const isSpeaking = audioLevel > 0.08;
        const now = Date.now();

        if (isSpeaking) {
            this.lastSpeakingTime = now;
            this.silenceDuration = 0;
        } else {
            this.silenceDuration = Number(((now - this.lastSpeakingTime) / 1000).toFixed(1));
        }

        // 3. Frequency Spectrum Analysis (Detect distinct dual formant peaks in human voice range 300Hz-3400Hz)
        let lowVoiceEnergy = 0;  // 300Hz - 1000Hz (Male / Deep Pitch)
        let highVoiceEnergy = 0; // 1200Hz - 3000Hz (Female / Child / Overlapping Voice)

        // Frequency per bin = sampleRate / fftSize (e.g. 48000 / 512 ≈ 93.75 Hz)
        const sampleRate = this.audioContext?.sampleRate || 44100;
        const binWidth = sampleRate / 512;

        for (let bin = 3; bin < Math.min(bufferLength, 40); bin++) {
            const freq = bin * binWidth;
            const energy = freqData[bin] / 255;
            if (freq >= 300 && freq <= 1000) lowVoiceEnergy += energy;
            if (freq > 1200 && freq <= 3200) highVoiceEnergy += energy;
        }

        const dualVoiceDetected = isSpeaking && lowVoiceEnergy > 4.5 && highVoiceEnergy > 4.0;
        const secondaryConfidence = dualVoiceDetected ? 0.82 : 0.0;

        return {
            audioLevel: Number(audioLevel.toFixed(3)),
            isSpeaking,
            silenceDurationSeconds: this.silenceDuration,
            dualVoiceDetected,
            secondaryConfidence
        };
    }

    public cleanup(): void {
        this.isRunning = false;
        try {
            if (this.mediaStreamSource) this.mediaStreamSource.disconnect();
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
        } catch (e) {
            console.warn('[AIShield Audio Engine] Cleanup error:', e);
        }
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
    }
}
