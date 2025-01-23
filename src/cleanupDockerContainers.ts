import Docker from "dockerode";

const docker = new Docker();

async function removeAllContainers() {
  const containers = await docker.listContainers({ all: true });
  const removalPromises = containers.map(async (containerInfo) => {
    const container = docker.getContainer(containerInfo.Id);
    try {
      await container.stop();
    } catch (error) {
      // Container might already be stopped, log if needed
      console.log(
        "some error, Container might already be stopped, log if needed"
      );
    }
    await container.remove();
    console.log(`Removed container: ${containerInfo.Id}`);
  });

  await Promise.all(removalPromises);
}

export default async function cleanUpDockerContainers() {
  try {
    console.log("[cleanUpDockerContainers.ts] Removing all containers...");
    await removeAllContainers();
    console.log("[cleanUpDockerContainers.ts] Removed all containers...");
  } catch (error) {
    console.error("Error:", error);
  }
}
