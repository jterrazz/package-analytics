globalThis.fetch = async (input) => {
    process.stderr.write(`outbound request: ${String(input)}\n`);
    throw new Error('this process is offline');
};
