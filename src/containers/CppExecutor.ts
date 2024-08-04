// import Docker from 'dockerode';

// import { TestCases } from '../types/testCases';
import CodeExecutorStrategy, {
    ExecutionResponse,
} from "../types/codeExecutorStrategy";
import { CPP_IMAGE } from "../utils/constants";
import createContainer from "./containerFactory";
import decodeDockerStream from "./dockerHelper";
import pullImage from "./pullImage";

class CppExecutor implements CodeExecutorStrategy {
    async execute(
        code: string,
        inputTestCase: string,
        outputTestCase: string
    ): Promise<ExecutionResponse> {
        console.log("[CppExecutor.ts] Cpp executor called");
        console.log("[CppExecutor.ts] Code:", code);
        console.log("[CppExecutor.ts] inputTestCase: ", inputTestCase);
        console.log("[CppExecutor.ts] outputTestCase: ", outputTestCase);

        const rawLogBuffer: Buffer[] = [];

        await pullImage(CPP_IMAGE);

        const runCommand = `echo '${code.replace(
            /'/g,
            `'\\"`
        )}' > main.cpp && g++ main.cpp -o main && echo '${inputTestCase.replace(
            /'/g,
            `'\\"`
        )}' | ./main`;
        console.log("[CppExecutor.ts] runCommand: ", runCommand);

        console.log("[CppExecutor.ts] Initialising a new cpp docker container");
        const cppDockerContainer = await createContainer(CPP_IMAGE, [
            "/bin/sh",
            "-c",
            runCommand,
        ]);

        // starting / booting the corresponding docker container
        console.log("[CppExecutor.ts] Starting a new cpp docker container");
        await cppDockerContainer.start();

        console.log("[CppExecutor.ts] Started the docker container");

        const loggerStream = await cppDockerContainer.logs({
            stdout: true,
            stderr: true,
            timestamps: false,
            follow: true, // whether the logs are streamed or returned as a string
        });

        // Attach events on the stream objects to start and stop reading
        loggerStream.on("data", (chunk) => {
            rawLogBuffer.push(chunk);
        });

        try {
            const codeResponse: string = await this.fetchDecodedStream(
                loggerStream,
                rawLogBuffer
            );
            return { output: codeResponse, status: "COMPLETED" };
        } catch (error) {
            return { output: error as string, status: "ERROR" };
        } finally {
            await cppDockerContainer.remove();
        }
    }

    fetchDecodedStream(
        loggerStream: NodeJS.ReadableStream,
        rawLogBuffer: Buffer[]
    ): Promise<string> {
        return new Promise((res, rej) => {
            loggerStream.on("end", () => {
                console.log("[CppExecutor.ts] rawLogBuffer:", rawLogBuffer);

                const completeBuffer = Buffer.concat(rawLogBuffer);
                const decodedStream = decodeDockerStream(completeBuffer);

                console.log("[CppExecutor.ts] decodedStream: ", decodedStream);
                // console.log(decodedStream.stdout);

                if (decodedStream.stderr) {
                    rej(decodedStream.stderr);
                } else {
                    res(decodedStream.stdout);
                }
            });
        });
    }
}

export default CppExecutor;
