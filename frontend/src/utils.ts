/**
 * Format BTC numeric values by removing trailing zeroes
 * Handles BigInt, string, and null values
 */
export function formatBtcValue(value: bigint | string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return 'N/A';
    }

    const stringValue = value.toString();

    // If the value is 0, return 0
    if (stringValue === '0') return '0';

    // Pad with leading zeros to ensure we have enough digits for 8 decimal places
    const paddedValue = stringValue.padStart(9, '0');

    // Insert decimal point 8 places from the end
    const wholePart = paddedValue.slice(0, -8);
    const fractionalPart = paddedValue.slice(-8);

    // Combine and remove trailing zeros
    const result = `${wholePart}.${fractionalPart}`;
    return result.replace(/\.?0+$/, '');
}

/**
 * Truncate hash for display while preserving full hash for tooltip
 */
export function truncateHash(hash: string | undefined): string {
    if (!hash) return '';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

/**
 * Get full hash value for tooltip - ensures we always show the complete hash
 */
export function getHashTitle(hash: string | undefined): string {
    return hash || '';
}

/**
 * Format Ethereum value from Wei to ETH
 * Handles hex strings and bigints
 */
export function formatEthValue(value: string | bigint | number | undefined): string {
    if (!value) return '0 ETH';

    try {
        // Convert to BigInt first
        const bigIntValue = BigInt(value);

        // Convert to ETH (div by 1e18)
        // We use string manipulation to avoid floating point errors
        const valueStr = bigIntValue.toString();

        if (valueStr.length <= 18) {
            // Less than 1 ETH
            const padded = valueStr.padStart(19, '0');
            const decimal = padded.slice(0, -18) + '.' + padded.slice(-18);
            return parseFloat(decimal).toFixed(6).replace(/\.?0+$/, '') + ' ETH';
        }

        const whole = valueStr.slice(0, -18);
        const fraction = valueStr.slice(-18);
        const result = whole + '.' + fraction;

        return parseFloat(result).toFixed(6).replace(/\.?0+$/, '') + ' ETH';
    } catch (e) {
        return 'Invalid Value';
    }
}
