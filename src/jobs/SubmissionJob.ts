import { Job } from "bullmq";

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
            const inputTestCase = this.payload[key].inputCase;
            const outputTestCase = this.payload[key].outputCase;
            const strategy = createExecutor(codeLanguage);
            if (strategy != null) {
                const response: ExecutionResponse = await strategy.execute(
                    code,
                    inputTestCase,
                    outputTestCase
                );
                if (response.status === "COMPLETED") {
                    console.log(
                        "[SubmissionJob.ts] Code executed successfully"
                    );
                    console.log("[SubmissionJob.ts] response: ", response);
                } else {
                    console.log(
                        "[SubmissionJob.ts] Something went wrong with code execution"
                    );
                    console.log("[SubmissionJob.ts] response:", response);
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
