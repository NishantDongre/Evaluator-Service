import { Job } from "bullmq";

import evaluationQueueProducer from "../producers/evaluationQueueProducer";
import { IJob } from "../types/bullMqJobDefinition";
import { ExecutionResponse } from "../types/codeExecutorStrategy";
import { SubmissionPayload } from "../types/submissionPayload";
import createExecutor from "../utils/executorFactory";

export default class SubmissionJob implements IJob {
    name: string;
    payload: Record<string, SubmissionPayload>;
    constructor(payload: Record<string, SubmissionPayload>) {
        this.payload = payload;
        this.name = this.constructor.name;
    }

    handle = async (job?: Job) => {
        console.log("[SubmissionJob.ts] Handler of the job called ");
        console.log("[SubmissionJob.ts] this.payload: ", this.payload);
        if (job) {
            const key = Object.keys(this.payload)[0];
            const codeLanguage = this.payload[key].language;
            const code = this.payload[key].code;
            const testCases = this.payload[key].testCases;
            const timeLimit = this.payload[key].timeLimit;
            const isCustomTestCase = this.payload[key].isCustomTestCase;
            const actualCode = this.payload[key].actualCode;
            const problemId = this.payload[key].problemId;


            // console.log("Job timeLimit", this.payload[key]);
            const strategy = createExecutor(codeLanguage);
            if (strategy != null) {
                // user code Running
                const response: ExecutionResponse[] = await strategy.execute(
                    code,
                    testCases,
                    timeLimit,
                    isCustomTestCase
                );
                if (response) {
                    console.log("[SubmissionJob.ts] User code response: ", response);
                }
                if (isCustomTestCase) {
                    console.log(
                        "[SubmissionJob.ts] Started Running Actual Code for Expected output for Custom Testcase"
                    );
                    const actualCodeStrategy = createExecutor('c_cpp'); // ActualCode will always be in C++

                    if (actualCodeStrategy != null) {
                        const actualCodeResponse: ExecutionResponse[] =
                            await actualCodeStrategy.execute(
                                actualCode,
                                testCases,
                                timeLimit,
                                isCustomTestCase
                            );
                        console.log(
                            "[SubmissionJob.ts] Ended Running Actual Code for Expected output for Custom Testcase"
                        );

                        console.log(
                            "[SubmissionJob.ts] actualCodeResponse: ", actualCodeResponse
                        );

                        let responseSendToUser;

                        if (response[0] && response[0].status == 'FAILED') {
                            const firstTLE = response.find(
                                (item) => item.type === "TLE"
                            );
                            const firstRE = response.find(
                                (item) => item.type === "RE"
                            );
                            const firstCE = response.find(
                                (item) => item.type === "CE"
                            );
                            if (firstTLE) {
                                responseSendToUser = {
                                    isCE: false,
                                    isRE: false,
                                    isTLE: true,
                                    isWA: false,
                                    firstTLE: { ...firstTLE, expected: actualCodeResponse[0].output },
                                    output: response[0].output,
                                    expected: actualCodeResponse[0].output,
                                    status: "TLE",
                                    input: response[0].input,
                                    isCustomTestCase
                                };
                            } else if (firstRE) {
                                responseSendToUser = {
                                    isCE: false,
                                    isRE: true,
                                    isTLE: false,
                                    isWA: false,
                                    firstRE: { ...firstRE, expected: actualCodeResponse[0].output },
                                    output: response[0].output,
                                    expected: actualCodeResponse[0].output,
                                    status: "RE",
                                    input: response[0].input,
                                    isCustomTestCase
                                };
                            } else {
                                responseSendToUser = {
                                    isCE: true,
                                    isRE: false,
                                    isTLE: false,
                                    isWA: false,
                                    firstCE: { ...firstCE, expected: actualCodeResponse[0].output },
                                    output: response[0].output,
                                    expected: actualCodeResponse[0].output,
                                    status: "CE",
                                    input: response[0].input,
                                    isCustomTestCase
                                };
                            }
                        } else if (response[0].output.trim() != actualCodeResponse[0].output.trim()) {
                            responseSendToUser = {
                                isCE: false,
                                isRE: false,
                                isTLE: false,
                                isWA: true,
                                firstWA: { ...response[0], expected: actualCodeResponse[0].output, status: "FAILED", type: "WA" },
                                output: response[0].output,
                                expected: actualCodeResponse[0].output,
                                status: "WA",
                                input: response[0].input,
                                isCustomTestCase
                            };
                        }

                        else {
                            responseSendToUser = {
                                isCE: false,
                                isRE: false,
                                isTLE: false,
                                isWA: false,
                                output: response[0].output,
                                expected: actualCodeResponse[0].output,
                                status: "ACCEPTED",
                                input: response[0].input,
                                isCustomTestCase
                            };
                        }
                        evaluationQueueProducer({
                            responseSendToUser,
                            userId: this.payload[key].userId,
                            problemId

                        });
                    }
                } else {
                    const totalTestCases = response.length;
                    const totalTestCasesPassed = response.reduce(
                        (acc, testCaseResponse) =>
                            acc + (testCaseResponse.status === "SUCCESS" ? +1 : 0),
                        0
                    );
                    // const totalFailedTestCases = totalTestCases - totalTestCasesPassed;
                    // const userCodeTestCasesPassed = response.filter((testCaseResponse) => testCaseResponse.status === "SUCCESS");
                    const userCodeTestCasesFailed = response.filter(
                        (testCaseResponse) => testCaseResponse.status === "FAILED"
                    );
                    const firstTLE = userCodeTestCasesFailed.find(
                        (item) => item.type === "TLE"
                    );
                    const firstWA = userCodeTestCasesFailed.find(
                        (item) => item.type === "WA"
                    );
                    const firstCE = userCodeTestCasesFailed.find(
                        (item) => item.type === "CE"
                    );

                    const res = response.map((item) => {
                        return {
                            output: item.output,
                            status: item.status,
                            type: item.type,
                        };
                    });

                    let responseSendToUser;
                    if (firstCE) {
                        responseSendToUser = {
                            totalTestCases,
                            totalTestCasesPassed,
                            isCE: true,
                            isTLE: false,
                            isWA: false,
                            isRE: false,
                            status: "FAILED",
                            firstCE,
                            res,
                            isCustomTestCase
                        };
                    }
                    else if (firstTLE) {
                        responseSendToUser = {
                            totalTestCases,
                            totalTestCasesPassed,
                            isCE: false,
                            isTLE: true,
                            isWA: false,
                            isRE: false,
                            status: "FAILED",
                            firstTLE,
                            res,
                            isCustomTestCase
                        };
                    } else if (firstWA) {
                        responseSendToUser = {
                            totalTestCases,
                            totalTestCasesPassed,
                            isCE: false,
                            isTLE: false,
                            isWA: true,
                            isRE: false,
                            status: "FAILED",
                            firstWA,
                            res,
                            isCustomTestCase
                        };
                    } else if (totalTestCases === totalTestCasesPassed) {
                        responseSendToUser = {
                            totalTestCases,
                            totalTestCasesPassed,
                            isCE: false,
                            isTLE: false,
                            isWA: false,
                            isRE: false,
                            status: "ACCEPTED",
                            firstTLE,
                            res,
                            isCustomTestCase
                        };
                    } else {
                        responseSendToUser = {
                            totalTestCases,
                            totalTestCasesPassed,
                            isCE: false,
                            isTLE: false,
                            isWA: false,
                            isRE: true,
                            status: "FAILED",
                            firstRE: response[0],
                            res,
                            isCustomTestCase
                        };
                    }
                    evaluationQueueProducer({
                        responseSendToUser,
                        userId: this.payload[key].userId,
                        submissionId: this.payload[key].submissionId,
                        problemId
                    });
                }
            }
        }
    };

    failed = (job?: Job): void => {
        console.log("[SubmissionJob.ts] Job failed");
        if (job) {
            console.log("[SubmissionJob.ts] job failed with Job ID: ", job.id);
        }
    };
}
