// ----------------- Sound Synthesizer (Web Audio API) -----------------
class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = null;
        this.musicVolume = null;
        this.musicPlaying = false;
        this.ambientTimer = null;
        this.chordIndex = 0;
        this.chords = [
            [155.56, 195.99, 233.08, 293.66], // Eb maj7 (Eb3, G3, Bb3, D4)
            [195.99, 233.08, 293.66, 349.23], // Gm7 (G3, Bb3, D4, F4)
            [174.61, 220.00, 261.63, 329.63], // F maj7 (F3, A3, C4, E4)
            [146.83, 174.61, 220.00, 261.63]  // Dm7 (D3, F3, A3, C4)
        ];
    }

    init() {
        if (this.ctx) return;
        
        // Setup AudioContext
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();
        
        // Master Volume
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.setValueAtTime(0.5, this.ctx.currentTime);
        this.masterVolume.connect(this.ctx.destination);
        
        // Music Volume
        this.musicVolume = this.ctx.createGain();
        this.musicVolume.gain.setValueAtTime(0.12, this.ctx.currentTime);
        this.musicVolume.connect(this.masterVolume);

        // Start Ambient Procedural Track
        this.startMusic();
    }

    toggle() {
        this.enabled = !this.enabled;
        const icon = document.getElementById('sound-toggle');
        if (icon) {
            icon.innerText = this.enabled ? '🔊' : '🔇';
        }
        
        if (this.ctx) {
            if (this.enabled) {
                this.ctx.resume();
            } else {
                this.ctx.suspend();
            }
        }
    }

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    playShoot(isBlue) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Main plasma core frequency sweep
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.type = 'sawtooth';
        // Blue is higher pitch, Orange is lower pitch
        const startFreq = isBlue ? 650 : 350;
        const endFreq = isBlue ? 150 : 80;
        
        osc.frequency.setValueAtTime(startFreq, now);
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.2);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);

        // High frequency laser crackle
        const laserOsc = this.ctx.createOscillator();
        const laserGain = this.ctx.createGain();
        laserOsc.connect(laserGain);
        laserGain.connect(this.masterVolume);

        laserOsc.type = 'triangle';
        laserOsc.frequency.setValueAtTime(isBlue ? 1200 : 800, now);
        laserOsc.frequency.linearRampToValueAtTime(2000, now + 0.08);

        laserGain.gain.setValueAtTime(0.08, now);
        laserGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        laserOsc.start(now);
        laserOsc.stop(now + 0.08);
    }

    playTeleport() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Woooosh sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.3);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);

        // High pitch swirl sparkle
        const sparkOsc = this.ctx.createOscillator();
        const sparkGain = this.ctx.createGain();
        sparkOsc.connect(sparkGain);
        sparkGain.connect(this.masterVolume);

        sparkOsc.type = 'triangle';
        sparkOsc.frequency.setValueAtTime(1800, now);
        sparkOsc.frequency.linearRampToValueAtTime(300, now + 0.25);

        sparkGain.gain.setValueAtTime(0.06, now);
        sparkGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        sparkOsc.start(now);
        sparkOsc.stop(now + 0.25);
    }

    playGrab() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.setValueAtTime(450, now + 0.05);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playRelease() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.setValueAtTime(250, now + 0.05);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playButton(pressed) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(pressed ? 240 : 380, now);
        osc.frequency.exponentialRampToValueAtTime(pressed ? 380 : 240, now + 0.1);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    playDoor(open) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Noise buffer for mechanical friction
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        
        const gain = this.ctx.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        filter.frequency.setValueAtTime(open ? 400 : 800, now);
        filter.frequency.exponentialRampToValueAtTime(open ? 800 : 200, now + 0.8);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        
        noise.start(now);
        noise.stop(now + 0.85);

        // Low hum
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.connect(humGain);
        humGain.connect(this.masterVolume);
        hum.frequency.setValueAtTime(90, now);
        humGain.gain.setValueAtTime(0.05, now);
        humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        hum.start(now);
        hum.stop(now + 0.8);
    }

    playFizzler() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        // Dissolve zapping sound
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.setValueAtTime(10, now);

        const gain = this.ctx.createGain();

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.linearRampToValueAtTime(80, now + 0.8);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.start(now);
        noise.stop(now + 0.8);

        // Synth buzz
        const buzz = this.ctx.createOscillator();
        const buzzGain = this.ctx.createGain();
        buzz.connect(buzzGain);
        buzzGain.connect(this.masterVolume);
        
        buzz.type = 'sawtooth';
        buzz.frequency.setValueAtTime(100, now);
        buzz.frequency.linearRampToValueAtTime(600, now + 0.5);

        buzzGain.gain.setValueAtTime(0.06, now);
        buzzGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        buzz.start(now);
        buzz.stop(now + 0.5);
    }

    playStep() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1200, now);
        
        const gain = this.ctx.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        gain.gain.setValueAtTime(0.008, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        
        noise.start(now);
        noise.stop(now + 0.08);
    }

    playLanding() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.createNoiseBuffer();
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, now);
        
        const gain = this.ctx.createGain();
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
        
        noise.start(now);
        noise.stop(now + 0.25);
    }

    playGLaDOS(charBeep = true) {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        if (charBeep) {
            // Typewriter click
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.01);
            
            gain.gain.setValueAtTime(0.015, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
            
            osc.start(now);
            osc.stop(now + 0.03);
        } else {
            // Radio static hum
            const noise = this.ctx.createBufferSource();
            noise.buffer = this.createNoiseBuffer();
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, now);
            filter.Q.setValueAtTime(2, now);
            
            const gain = this.ctx.createGain();
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterVolume);
            
            gain.gain.setValueAtTime(0.04, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            
            noise.start(now);
            noise.stop(now + 0.15);
        }
    }

    playLevelComplete() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Beautiful sci-fi arpeggio chime
        const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C major notes arpeggio
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            
            gain.gain.setValueAtTime(0.0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.08, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.5);
            
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.5);
        });
    }

    playElevatorHum() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Low industrial loop
        const osc = this.ctx.createOscillator();
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        const oscGain = this.ctx.createGain();

        lfo.frequency.setValueAtTime(2.5, now); // 2.5Hz vibration tremolo
        lfoGain.gain.setValueAtTime(15, now); // scale change range
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency); // frequency modulate the hum

        osc.connect(oscGain);
        oscGain.connect(this.masterVolume);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, now); // Low Eb hum
        
        oscGain.gain.setValueAtTime(0.0, now);
        oscGain.gain.linearRampToValueAtTime(0.08, now + 0.5);
        
        osc.start(now);
        lfo.start(now);

        return {
            stop: () => {
                const stopTime = this.ctx.currentTime;
                oscGain.gain.cancelScheduledValues(stopTime);
                oscGain.gain.setValueAtTime(oscGain.gain.value, stopTime);
                oscGain.gain.exponentialRampToValueAtTime(0.001, stopTime + 0.3);
                setTimeout(() => {
                    try { osc.stop(); lfo.stop(); } catch(e) {}
                }, 400);
            }
        };
    }

    startMusic() {
        if (this.musicPlaying) return;
        this.musicPlaying = true;
        this.chordIndex = 0;
        
        const tick = () => {
            if (!this.musicPlaying || !this.enabled) return;
            this.playAmbientPadChord();
            this.ambientTimer = setTimeout(tick, 4500); // loop every 4.5s
        };
        
        tick();
    }

    playAmbientPadChord() {
        const now = this.ctx.currentTime;
        const chord = this.chords[this.chordIndex];
        this.chordIndex = (this.chordIndex + 1) % this.chords.length;

        // Play 4 notes in Eb maj9 or Gm7 scale
        chord.forEach((freq) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            // slow filter cutoff sweep
            filter.frequency.setValueAtTime(300, now);
            filter.frequency.exponentialRampToValueAtTime(800, now + 2);
            filter.frequency.exponentialRampToValueAtTime(200, now + 4);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.musicVolume);

            // slow fade-in / fade-out
            gain.gain.setValueAtTime(0.0, now);
            gain.gain.linearRampToValueAtTime(0.03, now + 1.5);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

            osc.start(now);
            osc.stop(now + 4.5);
        });

        // Trigger a random science beep
        if (Math.random() > 0.4) {
            setTimeout(() => {
                if (!this.enabled || !this.musicPlaying) return;
                const beepTime = this.ctx.currentTime;
                const beepOsc = this.ctx.createOscillator();
                const beepGain = this.ctx.createGain();
                
                beepOsc.type = 'sine';
                const baseNote = chord[Math.floor(Math.random() * chord.length)];
                beepOsc.frequency.setValueAtTime(baseNote * 2, beepTime); // octave up
                
                beepOsc.connect(beepGain);
                beepGain.connect(this.musicVolume);

                beepGain.gain.setValueAtTime(0, beepTime);
                beepGain.gain.linearRampToValueAtTime(0.02, beepTime + 0.1);
                beepGain.gain.exponentialRampToValueAtTime(0.0001, beepTime + 1.2);

                beepOsc.start(beepTime);
                beepOsc.stop(beepTime + 1.2);
            }, Math.random() * 2000 + 500);
        }
    }

    stopMusic() {
        this.musicPlaying = false;
        if (this.ambientTimer) {
            clearTimeout(this.ambientTimer);
            this.ambientTimer = null;
        }
    }
}

export const sfx = new SoundEngine();
window.sfx = sfx; // Make globally accessible
