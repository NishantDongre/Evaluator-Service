export type SubmissionPayload = {
    code: string;
    language: string;
    testCases: { input: string; output: string }[],
    userId: string,
    problemId: string,
    submissionId: string,
    timeLimit: number,
    isCustomTestCase: boolean,
    actualCode: string,
};
