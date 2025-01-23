import bodyParser from "body-parser";
import express, { Express } from "express";

import cleanUpDockerContainers from "./cleanupDockerContainers";
import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import { initializePool } from "./initializePool";
import apiRouter from "./routes";
import { submission_queue } from "./utils/constants";
import submissionWorker from "./workers/submissionWorker";

const app: Express = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use("/api", apiRouter);
app.use("/bulldashboard", bullBoardAdapter.getRouter());

app.listen(serverConfig.PORT, () => {
  console.log(`Server started at PORT:${serverConfig.PORT}`);
  console.log(
    `BullBoard dashboard running on: http://localhost:${serverConfig.PORT}/bulldashboard`
  );

  (async () => {
    try {
      await cleanUpDockerContainers();
      await initializePool();

      // Handle termination signals for cleanup
      process.on("SIGINT", async () => {
        await cleanUpDockerContainers();

        process.exit();
      });

      process.on("SIGTERM", async () => {
        await cleanUpDockerContainers();
        process.exit();
      });

      // Start your server or application logic here
      console.log("Application started successfully.");
    } catch (error) {
      console.error("Failed to start the application:", error);
      process.exit(1);
    }
  })();

  // Sample Queue Testing
  //  sampleWorker('SampleQueue');
  //   sampleQueueProducer('SampleJob', {
  //     firstName: "Nishant",
  //     lastName: "Dongre",
  //     DOB: "May 19, 2001"
  //   });

  // Submission Queue Testing

  // Cpp Code
  // const userCode = `
  //   class Solution {
  //     public:
  //       int square(int n) {
  //           return n * n;
  //       }
  //   };
  // `;

  // const code = `
  //   #include<iostream>
  //   #include<vector>
  //   #include<stdio.h>
  //   using namespace std;

  //   ${userCode}

  // int main() {
  //   int n;
  //   cin>>n;

  //   Solution *obj = new Solution();

  //   for(int i=0;i<n;i++){
  //       int num;
  //       cin>>num;
  //       cout<<obj->square(num)<<endl;
  //   }

  //   return 0;
  // }
  // `;

  // const inputCase = `10 1 2 3 4 5 6 7 8 9 10`;

  // submissionWorker(submission_queue);
  // console.log("[index.ts] calling submissionQueueProducer");
  // submissionQueueProducer("SubmissionJob", {
  //     "1234": {
  //         language: "CPP",
  //         inputCase,
  //         code,
  //     },
  // });

  // Java Code
  //     const userCode = `
  //       class Solution {
  //           public int square(int n) {
  //               return n * n;
  //         }
  //       }
  //     `;

  //     const code = `
  //         import java.util.Scanner;

  //         ${userCode}

  //         public class Main {
  //             public static void main(String[] args) {
  //                 Scanner scanner = new Scanner(System.in);
  //                 int n = scanner.nextInt();

  //                 Solution obj = new Solution();

  //                 for (int i = 0; i < n; i++) {
  //                     int num = scanner.nextInt();
  //                     System.out.println(obj.square(num));
  //                 }

  //                 scanner.close();
  //             }
  //         }
  //     `;

  //     const inputCase = `10 1 2 3 4 5 6 7 8 9 10`;

  //     submissionWorker(submission_queue);
  //     console.log("[index.ts] calling submissionQueueProducer");
  //     submissionQueueProducer("SubmissionJob", {
  //         "1234": {
  //             language: "JAVA",
  //             inputCase,
  //             code,
  //         },
  //     });

  // Python Code
  // const userCode =
  //     "class Solution:\n    def square(self, n):\n        return n * n";
  // const code = `${userCode}\ndef main():\n    n = int(input())\n    solObj = Solution()\n    for i in range(n):\n        num = int(input())\n        print(solObj.square(num))\n\nif __name__ == "__main__":\n    main()`;

  // const inputCase = `10\n1\n2\n3\n4\n5\n6\n7\n8\n9\n10`;

  // submissionWorker(submission_queue);
  // console.log("[index.ts] calling submissionQueueProducer");
  // submissionQueueProducer("SubmissionJob", {
  //     "1234": {
  //         language: "PYTHON",
  //         inputCase,
  //         code,
  //     },
  // });

  submissionWorker(submission_queue);
});
