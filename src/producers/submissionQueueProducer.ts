import submissionQueue from "../queues/submissionQueue";

export default async function (name: string, payload: Record<string, unknown>) {
    console.log("[submissionQueueProducer.ts] Job Name:", name);
    console.log("[submissionQueueProducer.ts] Job Payload:", payload);
    await submissionQueue.add(name, payload);
    console.log(
        "[submissionQueueProducer.ts] Successfully added a new Submission job"
    );
}
