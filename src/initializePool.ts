import ContainerPool from "./containers/ContainerPool";
import { CPP_IMAGE ,JAVA_IMAGE, PYTHON_IMAGE } from "./utils/constants";

const cppContainerPool = new ContainerPool(CPP_IMAGE, 10);
const javaContainerPool = new ContainerPool(JAVA_IMAGE, 5);
const pythonContainerPool = new ContainerPool(PYTHON_IMAGE, 5);


export const initializePool = async () => {
  console.log("[initalizePool.ts] Initializing CPP Container Pool...");
  await cppContainerPool.initialize();
  console.log("[initalizePool.ts] CPP Container Pool Initialized.");

  console.log("[initalizePool.ts] Initializing JAVA Container Pool...");
  await javaContainerPool.initialize();
  console.log("[initalizePool.ts] JAVA Container Pool Initialized.");

  console.log("[initalizePool.ts] Initializing PYTHON Container Pool...");
  await pythonContainerPool.initialize();
  console.log("[initalizePool.ts] PYTHON Container Pool Initialized.");
};

export default {
  cppContainerPool,
  javaContainerPool,
  pythonContainerPool
};
