import express, { Express } from "express";

import serverConfig from "./config/serverConfig";
import sampleQueueProducer from "./producers/sampleQueueProducer";
import apiRouter from './routes';
import SampleWorker from "./workers/sampleWorker";

const app: Express = express();

app.use('/api', apiRouter);

app.listen(serverConfig.PORT, () => {
  console.log(`Server started at PORT:${serverConfig.PORT}`);
  SampleWorker('SampleQueue');

  sampleQueueProducer('SampleJob', {
    firstName: "Nishant",
    lastName: "Dongre",
    DOB: "May 19, 2001"
  });
});
