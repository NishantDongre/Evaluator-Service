interface CodeExecutorStrategy {
    execute(
        code: string,
        testCases: { input: string; output: string }[],
        timeLimit: number,
        isCustomTestCase: boolean,
    ): Promise<ExecutionResponse[]>;
}
export type ExecutionResponse = { input: string, output: string, expected: string, status: string, type: string };
export default CodeExecutorStrategy;
