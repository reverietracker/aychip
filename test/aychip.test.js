const { AYChip } = require("..");

test("can synthesise audio", () => {
    const chip = new AYChip({
        frequency: 1773400,
        sampleRate: 11025,
        stereoMode: 'acb',
    })
    chip.reset();
    chip.setRegister(0, 8);
    chip.setRegister(1, 0);
    chip.setRegister(7, 0x38);
    chip.setRegister(8, 15);

    buffer = [
        new Float32Array(32),
        new Float32Array(32),
    ];

    chip.generate(buffer, 0, 32);
    expect(buffer[0][0]).toBeCloseTo(0.28866705298423767);
    expect(buffer[0][1]).toBeCloseTo(0);
    expect(buffer[1][0]).toBeCloseTo(0.16666199266910553);
    expect(buffer[1][1]).toBeCloseTo(0);
});
