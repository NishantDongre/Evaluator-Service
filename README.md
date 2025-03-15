# CodeQuest - Evaluator Service - Code Execution and Evaluation System

The Evaluator Service is a robust and scalable microservice designed to securely execute and evaluate user-submitted code across a variety of programming languages using Docker containers. The service processes code efficiently with queues and worker systems, making it fast, scalable, and reliable.

<p align="center"><i>Figure 1: Overview of the Evaluator Service.</i></p>

![Image](https://github.com/user-attachments/assets/a054eac7-3b7e-44c0-a275-a23aab1f6dd9)

<p align="center"><i>Figure 2: Detailed Evaluator Service workflow.</i></p>

![Image](https://github.com/user-attachments/assets/def40623-6ef1-473d-a48a-ac9abfd481f4)

## Features

- **Multi-Language Support:** Supports C++, Java, and Python out of the box, with easy extensibility for other languages.

- **Secure Code Execution:** Isolated Docker containers ensure secure execution and prevent system compromise.

- **Efficient Resource Management:** Docker container pooling and queuing mechanisms optimize resource utilization.

- **Custom Test Case Handling:** Supports dynamic evaluation using reference solutions for custom test cases.

- **Time Limit Enforcement:** Prevents infinite loops and resource exhaustion with strict time limits.

- **Scalable Architecture:** Designed for horizontal scaling to handle high volumes of submissions.

- **Detailed Logging:** Comprehensive logging for debugging and monitoring.

## Architecture

The system is built with a microservice architecture, emphasizing modularity and scalability. Key components include:

- **Redis Queue System:** Utilizes BullMQ for efficient job management (submission and evaluation queues).

- **Submission Worker:** Processes incoming code submissions from the queue.

- **Executor Factory:** Employs the strategy pattern to dynamically create language-specific executors.

- **Language Executors (`CppExecutor`, `JavaExecutor`, `PythonExecutor`):** Manage code compilation and execution within isolated Docker containers.

- **Docker Container Pool:** Maintains a pool of pre-initialized Docker containers to minimize startup overhead.

- **Custom TestCase Processing:** Dynamically handles custom test case scenarios, including reference solution execution.

## Implementation Details

1.  **Redis Queues:**

    - `SubmissionQueue`: Stores incoming code execution requests.
    - `EvaluationQueue`: Stores processed results for further handling.

2.  **BullMQ Workers:**

    - `submissionWorker`: Processes jobs from the `SubmissionQueue`.

3.  **Job Handler:**

    - `SubmissionJob`: Coordinates the execution and evaluation process.

4.  **Strategy Pattern:**

    - `CodeExecutorStrategy`: Interface for language-specific executors.
    - `CppExecutor`, `JavaExecutor`, `PythonExecutor`: Language-specific implementations.

5.  **Docker Container Management:**
    - `genericContainerPool`: Manages Docker containers for different languages.

## Workflow

### 1. Code Submission Entry (Redis Queue System)

- User submits code through the client application.
- Submission data is enqueued in the **SubmissionQueue** (Redis-based queue using BullMQ).
- The submission payload includes:

  ```typescript
  {
    language: string,         // Programming language (e.g., "c_cpp", "java", "python")
    code: string,             // User's source code
    testCases: Array<{input: string, output: string}>, // Test cases to run
    timeLimit: number,        // Maximum execution time in milliseconds
    isCustomTestCase: boolean, // Flag for custom test case handling
    actualCode?: string,      // Reference solution (for custom test cases)
    userId: string,           // User identifier
    problemId: string,        // Problem identifier
    submissionId?: string     // Submission identifier (optional for custom test-case submissions)
  }
  ```

### 2. Worker Activation and Job Processing

- The **Submission Worker** (implemented with BullMQ Worker) constantly polls the `SubmissionQueue`.

- When a job is detected, the worker:

  - Extracts the job name to verify it's a "SubmissionJob".

  - Instantiates a new `SubmissionJob` class with the payload data.

  - Calls the job's `handle()` method to begin processing.

### 3. Executor Factory (Strategy Pattern)

- The `SubmissionJob` uses the factory pattern to obtain the appropriate executor:

  ```typescript
  const strategy = createExecutor(codeLanguage);
  ```

- The factory creates and returns an executor that implements the `CodeExecutorStrategy` interface.

- Each language has its own implementation (`CppExecutor`, `JavaExecutor`, `PythonExecutor`).

- The factory pattern allows for easy addition of new language support.

### 4. Docker Container Acquisition

- The language executor acquires a container from the **Docker Container Pool**:

  ```typescript
  const cppDockerContainer =
    await genericContainerPool.cppContainerPool.acquire();
  ```

- Containers are pre-initialized and managed in a pool to avoid the overhead of creation/destruction.

- This pooling system significantly improves performance for high-volume submissions.

### 5. Code Compilation (For Compiled Languages)

- For languages like C++, the executor first compiles the code inside the container:

  ```typescript
  const compileCommand = `printf '%s' '${
    code
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/'/g, "'\\''") // Properly escape single quotes
  }' > main.cpp && g++ main.cpp -o main`;

  const compileOutput = await this.executeCommandInContainer(
    cppDockerContainer,
    compileCommand,
    10000
  );
  ```

- Compilation errors are caught and reported as "CE" (Compilation Error).

- The executor enforces a separate compilation timeout (10 seconds in the example).

### 6. Code Execution Against Test Cases

- For each test case, the executor:

  - Prepares the execution command with input.

  - Executes the command in the container with the specified time limit.

  - Captures output and error streams.

  - Monitors for timeout conditions.

  ```typescript
  const executeCommand = `printf '%s' '${
    input
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/'/g, "'\\''") // Properly escape single quotes
  }' | ./main`;
  const runOutput = await this.executeCommandInContainer(
    cppDockerContainer,
    executeCommand,
    timeLimit
  );
  ```

  #### Docker Container Release

  - Regardless of the execution outcome, the container is returned to the pool:
    ```typescript
    genericContainerPool.cppContainerPool.release(cppDockerContainer);
    ```
  - This ensures efficient resource utilization and system stability

### 7. Result Processing, Classification and Packaging

- The system processes execution results for each test case and classifies them:

  - **`ACCEPTED`**: Output matches expected output.
  - **`WA`** (Wrong Answer): Output doesn't match expected output.
  - **`TLE`** (Time Limit Exceeded): Execution exceeded the time limit.
  - **`RE`** (Runtime Error): Program crashed during execution.
  - **`CE`** (Compilation Error): Failed to compile.

- The system creates a detailed result object containing:
  - Overall status (ACCEPTED/FAILED).
  - Total test cases and how many passed.
  - Detailed failure information for the first failing test case.
  - Error type flags (isCE, isRE, isTLE, isWA).
  - Complete test case results.
  - User and problem identifiers.

### 8. Result Queueing for Further Processing

- The final results are sent to the **`EvaluationQueue`** for further processing:

```typescript
evaluationQueueProducer({
  responseSendToUser,
  userId: this.payload[key].userId,
  submissionId: this.payload[key].submissionId,
  problemId,
});
```

- This allows for asynchronous handling of results.

## Error Handling and Reliability Features

#### Time Limit Enforcement

- The system enforces strict time limits for code execution:
- This prevents infinite loops and resource exhaustion

#### Container Isolation

- All code execution happens in isolated Docker containers
- This prevents malicious code from affecting the host system or other submissions
- Resource limits are enforced at the container level

#### Comprehensive Logging

- The system includes detailed logging throughout the process:
- This helps with debugging and monitoring system performance

<img width="748" alt="Image" src="https://github.com/user-attachments/assets/4cd1ac68-4e02-4697-b792-d21c41a6e043" />

#### System Scalability

- The Redis queue system allows for horizontal scaling of workers
- The Docker container pool enables efficient resource utilization
- The modular design allows for easy addition of new language support
- The asynchronous processing pattern decouples submission from evaluation

#### Security Considerations

- Code execution happens in isolated Docker containers
- Time limits prevent resource exhaustion attacks
- Input sanitization prevents shell injection

## Tech Stack

- **Node.js:** Runtime environment.
- **Redis:** In-memory data structure store for queuing.
- **BullMQ:** Robust queue system for Node.js based on Redis.
- **Docker:** Containerization platform for isolated execution.

## Installation & Setup

### Prerequisites

- Node.js and npm
- Redis server
- Docker

### Steps

1. Clone the repository:

   ```sh
   git clone https://github.com/NishantDongre/Evaluator-Service.git
   cd Evaluator-Service
   ```

2. Install dependencies:

   ```sh
   npm install
   ```

3. Set up environment variables (`.env`):

   ```env
   PORT=5001
   REDIS_HOST='127.0.0.1'
   REDIS_PORT=6379
   ```

4. Start the redis-server:

   ```sh
    sudo service redis-server start
    redis-cli
   ```

5. Start the Docker-Desktop

6. Start the service:
   ```sh
   npm run dev
   ```

## Contact

For queries, reach out at [nishantdongre30@gmail.com]
