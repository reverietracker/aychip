class AYChip {
    VOLUME_LEVELS = [
        0.000000, 0.004583, 0.006821, 0.009684,
        0.014114, 0.020614, 0.028239, 0.045633,
        0.056376, 0.088220, 0.117568, 0.149977,
        0.190123, 0.229088, 0.282717, 0.333324
    ];

    STEREO_MODES = {
        'ABC': [0.25, 0.5, 0.75],
        'ACB': [0.25, 0.75, 0.5],
        'BAC': [0.5, 0.25, 0.75],
        'BCA': [0.75, 0.25, 0.5],
        'CAB': [0.5, 0.75, 0.25],
        'CBA': [0.75, 0.5, 0.25]
    };

    constructor(opts) {
        this.frequency = opts.frequency;
        this.sampleRate = opts.sampleRate;
        this.cyclesPerSample = this.frequency / this.sampleRate;

        this.volume = ('volume' in opts ? opts.volume : 1);

        if (opts.panning) {
            this.setPanning(opts.panning);
        } else if (opts.stereoMode) {
            this.setPanning(this.STEREO_MODES[opts.stereoMode.toUpperCase()] || [0.5, 0.5, 0.5]);
        } else {
            this.setPanning([0.5, 0.5, 0.5]);
        }

        /* chip state */
        this.toneGeneratorAPhase = 0;
        this.toneGeneratorAPeriod = 8;
        this.toneGeneratorACounter = 0;
    
        this.toneGeneratorBPhase = 0;
        this.toneGeneratorBPeriod = 8;
        this.toneGeneratorBCounter = 0;
    
        this.toneGeneratorCPhase = 0;
        this.toneGeneratorCPeriod = 8;
        this.toneGeneratorCCounter = 0;
    
        this.noiseGeneratorPhase = 0;
        this.noiseGeneratorPeriod = 16;
        this.noiseGeneratorCounter = 0;
        this.noiseGeneratorSeed = 1;
    
        this.toneChanAMask = 0x00;
        this.toneChanBMask = 0x00;
        this.toneChanCMask = 0x00;
        this.noiseChanAMask = 0x00;
        this.noiseChanBMask = 0x00;
        this.noiseChanCMask = 0x00;
    
        this.envelopePeriod = 256;
        this.envelopeCounter = 0;
        this.envelopeRampCounter = 16;
        this.envelopeOnFirstRamp = true;
        this.envelopeAlternateMask = 0x00;
        this.envelopeAlternatePhase = 0x00;
        this.envelopeHoldMask = 0x00;
        this.envelopeAttackMask = 0x00;
        this.envelopeContinueMask = 0x00;
        this.envelopeValue = 0x00;

        this.registers = new Uint8Array(14);
    }

    setPanning(panning) {
        this.panVolumeAdjust = [];
        for (let i = 0; i < 3; i++) {
            /* kebby says we should do this. And you don't argue with kebby.
            http://conspiracy.hu/articles/8/ */
            this.panVolumeAdjust[i] = [
                this.volume * Math.sqrt(1.0-panning[i]), this.volume * Math.sqrt(panning[i])
            ];
        }
    }

    setRegister(reg, val) {
        this.registers[reg] = val;

        switch(reg) {
            case 0:
            case 1:
                this.toneGeneratorAPeriod = (((this.registers[1] & 0x0f) << 8) | this.registers[0]) * 8;
                if (this.toneGeneratorAPeriod === 0) this.toneGeneratorAPeriod = 8;
                break;
            case 2:
            case 3:
                this.toneGeneratorBPeriod = (((this.registers[3] & 0x0f) << 8) | this.registers[2]) * 8;
                if (this.toneGeneratorBPeriod === 0) this.toneGeneratorBPeriod = 8;
                break;
            case 4:
            case 5:
                this.toneGeneratorCPeriod = (((this.registers[5] & 0x0f) << 8) | this.registers[4]) * 8;
                if (this.toneGeneratorCPeriod === 0) this.toneGeneratorCPeriod = 8;
                break;
            case 6:
                this.noiseGeneratorPeriod = (val & 0x1f) * 16;
                if (this.noiseGeneratorPeriod === 0) this.noiseGeneratorPeriod = 16;
                break;
            case 7:
                this.toneChanAMask = (val & 0x01) ? 0xff : 0x00;
                this.toneChanBMask = (val & 0x02) ? 0xff : 0x00;
                this.toneChanCMask = (val & 0x04) ? 0xff : 0x00;
                this.noiseChanAMask = (val & 0x08) ? 0xff : 0x00;
                this.noiseChanBMask = (val & 0x10) ? 0xff : 0x00;
                this.noiseChanCMask = (val & 0x20) ? 0xff : 0x00;
                break;
            case 11:
            case 12:
                this.envelopePeriod = ((this.registers[12] << 8) | this.registers[11]) * 16;
                if (this.envelopePeriod === 0) this.envelopePeriod = 16;
                break;
            case 13:
                this.envelopeCounter = 0;
                this.envelopeRampCounter = 16;
                this.envelopeOnFirstRamp = true;
                this.envelopeAlternatePhase = 0x00;
                this.envelopeHoldMask = (val & 0x01) ? 0x0f : 0x00;
                this.envelopeAlternateMask = (val & 0x02) ? 0x0f : 0x00;
                this.envelopeAttackMask = (val & 0x04) ? 0x0f : 0x00;
                this.envelopeContinueMask = (val & 0x08) ? 0x0f : 0x00;
                break;
        }
    }

    reset() {
        for (let i = 0; i < 14; i++) {
            this.setRegister(i, 0);
        }
    }

    generate(outputBuffer, offset, count) {
        const bufferEnd = offset + count;
        const leftChannelData = outputBuffer[0];
        const rightChannelData = outputBuffer[1];

        for (let bufferPos = offset; bufferPos < bufferEnd; bufferPos++) {

            this.toneGeneratorACounter -= this.cyclesPerSample;
            while (this.toneGeneratorACounter < 0) {
                this.toneGeneratorACounter += this.toneGeneratorAPeriod;
                this.toneGeneratorAPhase ^= 0xff;
            }

            this.toneGeneratorBCounter -= this.cyclesPerSample;
            while (this.toneGeneratorBCounter < 0) {
                this.toneGeneratorBCounter += this.toneGeneratorBPeriod;
                this.toneGeneratorBPhase ^= 0xff;
            }

            this.toneGeneratorCCounter -= this.cyclesPerSample;
            while (this.toneGeneratorCCounter < 0) {
                this.toneGeneratorCCounter += this.toneGeneratorCPeriod;
                this.toneGeneratorCPhase ^= 0xff;
            }

            this.noiseGeneratorCounter -= this.cyclesPerSample;
            while (this.noiseGeneratorCounter < 0) {
                this.noiseGeneratorCounter += this.noiseGeneratorPeriod;

                if ((this.noiseGeneratorSeed + 1) & 2)
                    this.noiseGeneratorPhase ^= 0xff;

                /* rng is 17-bit shift reg, bit 0 is output.
                * input is bit 0 xor bit 3.
                */
                if (this.noiseGeneratorSeed & 1) this.noiseGeneratorSeed ^= 0x24000;
                this.noiseGeneratorSeed >>= 1;
            }

            this.envelopeCounter -= this.cyclesPerSample;
            while (this.envelopeCounter < 0) {
                this.envelopeCounter += this.envelopePeriod;

                this.envelopeRampCounter--;
                if (this.envelopeRampCounter < 0) {
                    this.envelopeRampCounter = 15;
                    this.envelopeOnFirstRamp = false;
                    this.envelopeAlternatePhase ^= 0x0f;
                }

                let envelopeValue = (
                    /* start with the descending ramp counter */
                    this.envelopeRampCounter
                    /* XOR with the 'alternating' bit if on an even-numbered ramp */
                    ^ (this.envelopeAlternatePhase && this.envelopeAlternateMask)
                );
                /* OR with the 'hold' bit if past the first ramp */
                if (!this.envelopeOnFirstRamp) envelopeValue |= this.envelopeHoldMask;
                /* XOR with the 'attack' bit */
                envelopeValue ^= this.envelopeAttackMask;
                /* AND with the 'continue' bit if past the first ramp */
                if (!this.envelopeOnFirstRamp) envelopeValue &= this.envelopeContinueMask;
            }

            const levelA = this.VOLUME_LEVELS[
                ((this.registers[8] & 0x10) ? envelopeValue : (this.registers[8] & 0x0f))
                & (this.toneGeneratorAPhase | this.toneChanAMask)
                & (this.noiseGeneratorPhase | this.noiseChanAMask)
            ];
            const levelB = this.VOLUME_LEVELS[
                ((this.registers[9] & 0x10) ? envelopeValue : (this.registers[9] & 0x0f))
                & (this.toneGeneratorBPhase | this.toneChanBMask)
                & (this.noiseGeneratorPhase | this.noiseChanBMask)
            ];
            const levelC = this.VOLUME_LEVELS[
                ((this.registers[10] & 0x10) ? envelopeValue : (this.registers[10] & 0x0f))
                & (this.toneGeneratorCPhase | this.toneChanCMask)
                & (this.noiseGeneratorPhase | this.noiseChanCMask)
            ];

            leftChannelData[bufferPos] += (
                this.panVolumeAdjust[0][0] * levelA + this.panVolumeAdjust[1][0] * levelB + this.panVolumeAdjust[2][0] * levelC
            );
            rightChannelData[bufferPos] += (
                this.panVolumeAdjust[0][1] * levelA + this.panVolumeAdjust[1][1] * levelB + this.panVolumeAdjust[2][1] * levelC
            );
        }
    };
}

module.exports = { AYChip };
