const { AYChip } = require("..");

test("can synthesise audio in mono", () => {
    const chip = new AYChip({
        frequency: 1773400,
        sampleRate: 11025,
    })
    chip.reset();
    chip.setRegister(0, 8);
    chip.setRegister(1, 0);
    chip.setRegister(2, 8);
    chip.setRegister(3, 0);
    chip.setRegister(4, 8);
    chip.setRegister(5, 0);
    chip.setRegister(6, 8);
    chip.setRegister(7, 0x28);
    chip.setRegister(8, 15);
    chip.setRegister(9, 8);
    chip.setRegister(10, 16);
    chip.setRegister(11, 48);
    chip.setRegister(12, 0);
    chip.setRegister(13, 0x0c);

    buffer = [
        new Float32Array(32),
        new Float32Array(32),
    ];

    chip.generate(buffer, 0, 32);

    resultLeft = Array.from(buffer[0].map(i => Math.floor(i*256)));
    resultRight = Array.from(buffer[0].map(i => Math.floor(i*256)));

    expectedResult = [
        70, 0, 0, 70, 71, 0, 0, 71, 71, 0, 0, 71, 61, 0, 0, 72, 72, 0, 0, 73, 73, 0, 0, 74, 74, 0, 0, 74, 75, 0, 0, 75
    ]

    expect(resultLeft).toStrictEqual(expectedResult);
    expect(resultRight).toStrictEqual(expectedResult);
});

test("can synthesise audio 2", () => {
    const chip = new AYChip({
        frequency: 1773400,
        sampleRate: 11025,
    })
    chip.reset();
    chip.setRegister(0, 8);
    chip.setRegister(1, 0);
    chip.setRegister(2, 8);
    chip.setRegister(3, 0);
    chip.setRegister(4, 8);
    chip.setRegister(5, 0);
    chip.setRegister(6, 8);
    chip.setRegister(7, 0x37);
    chip.setRegister(8, 16);
    chip.setRegister(9, 16);
    chip.setRegister(10, 15);
    chip.setRegister(11, 48);
    chip.setRegister(12, 0);
    chip.setRegister(13, 0x03);

    buffer = [
        new Float32Array(32),
        new Float32Array(32),
    ];

    chip.generate(buffer, 0, 32);

    resultLeft = Array.from(buffer[0].map(i => Math.floor(i*256)));
    resultRight = Array.from(buffer[0].map(i => Math.floor(i*256)));

    expectedResult =     [
        181, 181, 181, 181, 162, 162, 162,
        162, 162, 143, 101, 143, 101, 143,
        129, 129, 129, 129, 129, 114, 114,
         87, 114, 102, 102, 102,  81, 102,
         92,  92,  92,  92
      ]

    expect(resultLeft).toStrictEqual(expectedResult);
    expect(resultRight).toStrictEqual(expectedResult);
});

test("can synthesise audio with stereo mode parameter", () => {
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

test("can synthesise audio with invalid stereo mode parameter", () => {
    const chip = new AYChip({
        frequency: 1773400,
        sampleRate: 11025,
        stereoMode: 'xyz',
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
    expect(buffer[0][0]).toBeCloseTo(0.23569566011428833);
    expect(buffer[0][1]).toBeCloseTo(0);
    expect(buffer[1][0]).toBeCloseTo(0.23569566011428833);
    expect(buffer[1][1]).toBeCloseTo(0);
});

test("can synthesise audio with custom panning parameter and volume", () => {
    const chip = new AYChip({
        frequency: 1773400,
        sampleRate: 11025,
        panning: [0.375, 0.625, 0.5],
        volume: 0.5,
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
    expect(buffer[0][0]).toBeCloseTo(0.13175788521766663);
    expect(buffer[0][1]).toBeCloseTo(0);
    expect(buffer[1][0]).toBeCloseTo(0.10205921530723572);
    expect(buffer[1][1]).toBeCloseTo(0);
});
