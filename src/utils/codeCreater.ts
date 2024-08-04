export default function codeCreator(
    startingCode: string,
    middleCode: string,
    endCode: string
): string {
    return `
        ${startingCode}
        ${middleCode}
        ${endCode}
    `;
}

/**
 * Python endCode can be passed as empty string
 *
 * Java endCode can be passed as empty string
 */
