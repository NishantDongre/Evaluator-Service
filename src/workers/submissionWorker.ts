import { Job, Worker } from "bullmq";

import redisConnection from "../config/redisConfig";
import SubmissionJob from "../jobs/SubmissionJob";

export default function submissionWorker(queueName: string) {
    new Worker(
        queueName,
        async (job: Job) => {
            console.log(
                "[submissionWorker.ts] SubmissionJob job worker kicking -> Job: ",
                job
            );
            if (job.name === "SubmissionJob") {
                const submissionJobInstance = new SubmissionJob(job.data);

                console.log("[submissionWorker.ts] Calling job handler");
                submissionJobInstance.handle(job);

                return true;
            }
        },
        {
            connection: redisConnection,
        }
    );
}
