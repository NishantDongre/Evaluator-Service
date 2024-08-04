// import Docker from 'dockerode';

// import { TestCases } from '../types/testCases';
import CodeExecutorStrategy, {
    ExecutionResponse,
} from "../types/codeExecutorStrategy";
import { PYTHON_IMAGE } from "../utils/constants";
import createContainer from "./containerFactory";
import decodeDockerStream from "./dockerHelper";
import pullImage from "./pullImage";

class PythonExecutor implements CodeExecutorStrategy {
    async execute(
        code: string,
        inputTestCase: string,
        outputTestCase: string
    ): Promise<ExecutionResponse> {
        console.log("[PythonExecutor.ts] Python executor called");
        console.log("[PythonExecutor.ts] Code:", code);
        console.log("[PythonExecutor.ts] inputTestCase: ", inputTestCase);
        console.log("[PythonExecutor.ts] outputTestCase: ", outputTestCase);
        const rawLogBuffer: Buffer[] = [];

        await pullImage(PYTHON_IMAGE);

        const runCommand = `echo '${code.replace(
            /'/g,
            `'\\"`
        )}' > test.py && echo '${inputTestCase.replace(
            /'/g,
            `'\\"`
        )}' | python3 test.py`;

        console.log("[PythonExecutor.ts] runCommand: ", runCommand);

        console.log(
            "[PythonExecutor.ts] Initialising a new Python docker container"
        );

        // const pythonDockerContainer = await createContainer(PYTHON_IMAGE, ['python3', '-c', code, 'stty -echo']);
        const pythonDockerContainer = await createContainer(PYTHON_IMAGE, [
            "/bin/sh",
            "-c",
            runCommand,
        ]);

        // starting / booting the corresponding docker container
        console.log(
            "[PythonExecutor.ts] Starting a new Python docker container"
        );
        await pythonDockerContainer.start();

        console.log("[PythonExecutor.ts] Started the docker container");

        const loggerStream = await pythonDockerContainer.logs({
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
            // remove the container when done with it
            await pythonDockerContainer.remove();
        }
    }

    fetchDecodedStream(
        loggerStream: NodeJS.ReadableStream,
        rawLogBuffer: Buffer[]
    ): Promise<string> {
        return new Promise((res, rej) => {
            loggerStream.on("end", () => {
                console.log("[PythonExecutor.ts] rawLogBuffer:", rawLogBuffer);

                const completeBuffer = Buffer.concat(rawLogBuffer);
                const decodedStream = decodeDockerStream(completeBuffer);

                console.log(
                    "[PythonExecutor.ts] decodedStream: ",
                    decodedStream
                );

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

export default PythonExecutor;
