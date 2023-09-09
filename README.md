# aychip

Emulator for the AY-3-8912 sound chip

## Installation

```
npm install aychip
```

## Usage

This package exports a class `AYChip` that is capable of generating audio waveforms in response to register writes. The constructor accepts an options object with the following properties:

* `frequency` (required) - The clock speed of the chip, in Hz.
* `sampleRate` (required) - The sample rate of the generated audio, in Hz.
* `volume` (optional) - The volume of the generated audio, as a number between 0 and 1. Defaults to 1.
* `stereoMode` (optional) - one of 'ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA' (case insensitive) indicating the positions to which each of the three AY channels should be panned. For example, 'ACB' means that channel A will be panned 50% left, channel C to the centre, and channel B 50% right. Any other value will be treated as all channels centred.
* `panning` (optional, takes precedence over `stereoMode`) - a list of three values from 0 to 1 indicating how far left or right each AY channel should be panned, with 0 being 100% left, 0.5 being centred, and 1 being 100% right. If neither `stereoMode` nor `panning` is specified, all channels will be centred.

The `AYChip` object provides the following methods:

* `setRegister(reg, val)` - Set the value of a register. `reg` is a number from 0 to 13, and `val` is a number from 0 to 255.
* `reset()` - Reset all registers to 0.
* `generate(outputBuffer, offset, count)` - Generate `count` samples of audio, writing them into `outputBuffer` - a two-element array of `Float32Array`s for the left and right channels, of sufficient length to hold the requested number of samples. Samples will be written starting at `offset`.
* `setPanning(panning)` - Set the panning for all channels. `panning` is a list of three values from 0 to 1 indicating how far left or right each AY channel should be panned, with 0 being 100% left, 0.5 being centred, and 1 being 100% right.
