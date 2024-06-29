import submissionQueue from "../queues/submissionQueue";

export default async function (name: string, payload: Record<string, unknown>) {
    console.log("name",name);
    console.log("payload",payload);
    await submissionQueue.add(name, payload);
    console.log("Successfully added a new submission job");
}