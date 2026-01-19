
import { formatBtcValue } from './frontend/src/utils';

const testCases = [
    { input: BigInt(100000000), expected: '1 BTC' },
    { input: BigInt(50000000), expected: '0.5 BTC' },
    { input: BigInt(123456789), expected: '1.23456789 BTC' },
    { input: BigInt(100), expected: '0.000001 BTC' },
    { input: BigInt(0), expected: '0 BTC' },
    { input: '100000000', expected: '1 BTC' }, // String input
    { input: 100000000, expected: '1 BTC' }, // Number input
];

console.log('Running formatBtcValue tests...');
let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }, index) => {
    const result = formatBtcValue(input);
    // The current implementation appends " BTC" in the component, not the function?
    // Wait, looking at App.tsx: `${formatBtcValue(accountBalance)} BTC`
    // So the function should JUST return the number string.

    // Adjust expectation for the function output (it should NOT have " BTC" suffix based on App.tsx usage)
    const expectedNumber = expected.replace(' BTC', '');

    if (result === expectedNumber) {
        console.log(`Test ${index + 1} PASSED: Input ${input} -> ${result}`);
        passed++;
    } else {
        console.log(`Test ${index + 1} FAILED: Input ${input} -> Expected ${expectedNumber}, Got ${result}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
