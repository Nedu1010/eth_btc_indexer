/**
 * Format BTC numeric values by removing trailing zeroes
 * Handles BigInt, string, and null values
 */
export function formatBtcValue(value: bigint | string | number | null | undefined): string {
    if (value === null || value === undefined) {
        return 'N/A';
    }

    const stringValue = value.toString();

    // If it's a whole number (no decimal point), return as is
    if (!stringValue.includes('.')) {
        return stringValue;
    }

    // Remove trailing zeroes after decimal point
    return stringValue.replace(/\.?0+$/, '');
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
