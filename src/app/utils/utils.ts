import { sha3_512 } from 'js-sha3';
import { v4 as uuidv4 } from 'uuid';
import { Buffer } from 'buffer'

function randomInt(min : number, max : number) {
    // minを含み、maxを含まない乱数を生成
    return Math.floor(Math.random() * (max - min) + min);
}

export async function solveSentinelChallenge(seed: string, difficulty: string): Promise<string> {
    const cores = [8, 12, 16, 24];
    const screens = [3000, 4000, 6000];

    const core = cores[randomInt(0, cores.length)];
    const screen = screens[randomInt(0, screens.length)];

    const parseTime = new Date().toString();

    const config = [
        core + screen,
        parseTime,
        4294705152,
        0,
        navigator.userAgent,
    ];

    const diffLen = difficulty.length / 2;

    for (let i = 0; i < 100000; i++) {
        config[3] = i;
        const jsonData = JSON.stringify(config);
        const base = Buffer.from(jsonData).toString("base64");
        const hashValue = sha3_512(seed + base);

        if (hashValue.substring(0, diffLen) <= difficulty) {
            const result = "gAAAAAB" + base;
            return result;
        }
    }

    const fallbackBase = Buffer.from(`"${seed}"`).toString("base64");
    return "gAAAAABwQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D" + fallbackBase;
}