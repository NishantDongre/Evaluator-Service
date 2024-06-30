import bodyParser from "body-parser";
import express, { Express } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import submissionQueueProducer from "./producers/submissionQueueProducer";
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
    //  sampleWorker('SampleQueue');

    //   sampleQueueProducer('SampleJob', {
    //     firstName: "Nishant",
    //     lastName: "Dongre",
    //     DOB: "May 19, 2001"
    //   });

    const userCode = `
      class Solution {
        public:
          vector<int> permute() {
              vector<int> v;
              int num = 1;
              cin>>num; 
              v.push_back(num);
              return v;
          }
      };
    `;

    const code = `
      #include<iostream>
      #include<vector>
      #include<stdio.h>
      using namespace std;
  
      ${userCode}

      int main() {
        Solution s;
        vector<int> result = s.permute();
        for(int x : result) {
          cout<<x<<" ";
        }
        cout<<endl;
        return 0;
      }
    `;

    const inputCase = `10`;

    submissionWorker(submission_queue);
    submissionQueueProducer("SubmissionJob", {
        "1234": {
            language: "CPP",
            inputCase,
            code,
        },
    });
});
