import bodyParser from 'body-parser';
import express, { Express } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import runJava from './containers/runJavaDocker';
import apiRouter from './routes';

const app: Express = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(bodyParser.text());

app.use('/api', apiRouter);
app.use('/bulldashboard', bullBoardAdapter.getRouter());

app.listen(serverConfig.PORT, () => {
  console.log(`Server started at PORT:${serverConfig.PORT}`);
  console.log(`BullBoard dashboard running on: http://localhost:${serverConfig.PORT}/bulldashboard`);
  // SampleWorker('SampleQueue');
  
  const code = `import java.util.Scanner;public class Main {public static void main(String[] args) {Scanner scanner = new Scanner(System.in);String firstName = scanner.nextLine();String lastName = scanner.nextLine();System.out.println("firstName: " + firstName);System.out.println("LastName: " + lastName);scanner.close();}}`;
  const inputCase = `Nishant\nDongre`;
  
  runJava(code, inputCase);
});
