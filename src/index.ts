import express, { Express } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import sampleQueueProducer from "./producers/sampleQueueProducer";
import apiRouter from './routes';
import SampleWorker from "./workers/sampleWorker";

const app: Express = express();

app.use('/api', apiRouter);
app.use('/bulldashboard', bullBoardAdapter.getRouter());

app.listen(serverConfig.PORT, () => {
  console.log(`Server started at PORT:${serverConfig.PORT}`);
  console.log(`BullBoard dashboard running on: http://localhost:${serverConfig.PORT}/bulldashboard`);
  SampleWorker('SampleQueue');

  sampleQueueProducer('SampleJob', {
    firstName: "Nishant",
    lastName: "Dongre",
    DOB: "May 19, 2001"
  });
});
