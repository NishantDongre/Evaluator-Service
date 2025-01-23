import genericContainerPool from "../initializePool";
import CodeExecutorStrategy, {
  ExecutionResponse,
} from "../types/codeExecutorStrategy";
import decodeDockerStream from "./dockerHelper";

class JavaExecutor implements CodeExecutorStrategy {
  async execute(
    code: string,
    testCases: { input: string; output: string }[],
    timeLimit: number,
    isCustomTestCase: boolean
  ): Promise<ExecutionResponse[]> {
    console.log("[JavaExecutor.ts] Java executor called");

    // Acquire a JAVA container from the pool
    const javaDockerContainer = await genericContainerPool.javaContainerPool.acquire();

    try {
      // Compile the code inside the running container
      const compileCommand = `echo '${code.replace(
        /'/g,
        `'\\"`
      )}' > Main.java && javac Main.java`;
      // console.log("[JavaExecutor.ts] compileCommand:", compileCommand);
      console.log("[JavaExecutor.ts] Below is Java Code compile Time");
      const compileOutput = await this.executeCommandInContainer(
        javaDockerContainer,
        compileCommand,
        20000
      ); // give 20 sec to compile the code

      console.log(
        "[JavaExecutor.ts] compileOutput Status: *********************************************************************************************",
        compileOutput
      );

      if (compileOutput.status === "ERROR") {
        return [
          {
            input: "",
            output: compileOutput.output,
            expected: "",
            status: "FAILED",
            type: "CE",
          },
        ];
      }

      const executionResults: ExecutionResponse[] = [];

      // Execute the compiled code for each test case
      for (const { input, output } of testCases) {
        const executeCommand = `echo '${input.replace(
          /'/g,
          `'\\"`
        )}' | java Main`;
        // console.log("[JavaExecutor.ts] executeCommand: ", executeCommand);

        const runOutput = await this.executeCommandInContainer(
          javaDockerContainer,
          executeCommand,
          timeLimit
        );

        if (isCustomTestCase) {
          const resultStatus =
            runOutput.status === "COMPLETED" ? "SUCCESS" : "FAILED";

          if (resultStatus === "FAILED") {
            if (runOutput.output === "TLE") {
              executionResults.push({
                input,
                output: runOutput.output,
                expected: "",
                status: resultStatus,
                type: "TLE",
              });
            } else {
              executionResults.push({
                input,
                output: runOutput.output,
                expected: "",
                status: resultStatus,
                type: "RE",
              });
            }
          } else {
            const type = "ACCEPTED";
            executionResults.push({
              input,
              output: runOutput.output,
              expected: "",
              status: resultStatus,
              type,
            });
          }
        } else {
          let resultStatus =
            runOutput.status === "COMPLETED" ? "SUCCESS" : "FAILED";

          if (resultStatus === "FAILED") {
            if (runOutput.output === "TLE") {
              executionResults.push({
                input,
                output: runOutput.output,
                expected: output,
                status: resultStatus,
                type: "TLE",
              });
            } else {
              executionResults.push({
                input,
                output: runOutput.output,
                expected: output,
                status: resultStatus,
                type: "RE",
              });
            }
          } else {
            resultStatus =
              runOutput.output.trim() === output.trim() ? "SUCCESS" : "FAILED";
            const type = resultStatus === "SUCCESS" ? "ACCEPTED" : "WA";
            executionResults.push({
              input,
              output: runOutput.output,
              expected: output,
              status: resultStatus,
              type,
            });
          }
          // const resultStatus = runOutput.output.trim() === output.trim() ? "SUCCESS" : "FAILED";
          // const type = resultStatus === "SUCCESS" ? "ACCEPTED" : runOutput.output === "TLE" ? "TLE" : "WA";
          // executionResults.push({ input, output: runOutput.output, status: resultStatus, type});
        }
      }

      return executionResults;
    } catch (error) {
      return [
        {
          input: "",
          output: error as string,
          expected: "",
          status: "ERROR",
          type: "RE",
        },
      ];
    } finally {
      // Release the container
      console.log("[Javaxecutor.ts] Releasing the JAVA docker container");
      genericContainerPool.javaContainerPool.release(javaDockerContainer);
    }
  }

  async executeCommandInContainer(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    container: any,
    command: string,
    timeLimit: number
  ): Promise<{ output: string; status: string }> {
    // Create an exec instance in the container
    const exec = await container.exec({
      Cmd: ["/bin/sh", "-c", command],
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
    });

    // Start the exec stream using the start method from Dockerode which returns a Promise
    const stream = await exec.start({ hijack: true, stdin: true });

    const rawLogBuffer: Buffer[] = [];
    // Collect the data from the stream
    stream.on("data", (chunk: Buffer) => rawLogBuffer.push(chunk));

    try {
      // Decode the collected stream data
      const decodedOutput = await this.fetchDecodedStream(
        stream,
        rawLogBuffer,
        timeLimit
      );
      console.log("decodedOutput", decodedOutput);
      return { output: decodedOutput, status: "COMPLETED" };
    } catch (error) {
      console.log("error", error);
      const str = error as string;
      console.log(str);
      if (str === "TLE") {
        return { output: error as string, status: "ERROR" };
      }

      return { output: error as string, status: "ERROR" };
    }
  }

  fetchDecodedStream(
    loggerStream: NodeJS.ReadableStream,
    rawLogBuffer: Buffer[],
    timeLimit: number
  ): Promise<string> {
    return new Promise((res, rej) => {
      // console.log("timeLimit",timeLimit);
      console.log("[JavaExecutor.ts] Code Execution startTime", Date());
      const timeout = setTimeout(() => {
        console.log("[JavaExecutor.ts] ERROR: TLE Timeout called");
        rej("TLE");
      }, timeLimit);

      loggerStream.on("end", () => {
        // console.log("[JavaExecutor.ts] rawLogBuffer:", rawLogBuffer);
        clearTimeout(timeout);
        const completeBuffer = Buffer.concat(rawLogBuffer);
        const decodedStream = decodeDockerStream(completeBuffer); // {stdout: string, stderr: string}

        console.log("[JavaExecutor.ts] decodedStream: ", decodedStream);
        // console.log(decodedStream.stdout);
        console.log("[JavaExecutor.ts] Code Execution endTime", Date());
        if (decodedStream.stderr) {
          rej(decodedStream.stderr);
        } else {
          res(decodedStream.stdout);
        }
      });
    });
  }
}

export default JavaExecutor;
