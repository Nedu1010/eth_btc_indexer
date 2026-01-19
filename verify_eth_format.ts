
import { formatEthValue } from './frontend/src/utils';

const testCases = [
    { input: '1000000000000000000', expected: '1.000000 ETH' }, // 1 ETH
    { input: '500000000000000000', expected: '0.500000 ETH' }, // 0.5 ETH
    { input: '1234567890000000000', expected: '1.234568 ETH' }, // ~1.23 ETH
    { input: '1000000000', expected: '0.000000 ETH' }, // Small amount (Gwei)
    { input: '0', expected: '0 ETH' },
    { input: undefined, expected: '0 ETH' },
];

console.log('Running formatEthValue tests...');
let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }, index) => {
    const result = formatEthValue(input);

    if (result === expected) {
        console.log(`Test ${index + 1} PASSED: Input ${input} -> ${result}`);
        passed++;
    } else {
        console.log(`Test ${index + 1} FAILED: Input ${input} -> Expected ${expected}, Got ${result}`);
        failed++;
    }
});

console.log(`\nResults: ${passed} Passed, ${failed} Failed`);
