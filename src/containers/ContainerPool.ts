import Docker from "dockerode";

class ContainerPool {
  private pool: Docker.Container[] = [];
  private docker: Docker;

  constructor(private imageName: string, private poolSize: number) {
    this.docker = new Docker();
  }

  async initialize() {
    for (let i = 0; i < this.poolSize; i++) {
      const container = await this.docker.createContainer({
        Image: this.imageName,
        Cmd: ["/bin/sh", "-c", "while :; do sleep 1; done"], // Keep-alive command
        AttachStdin: true, // to enable input streams
        AttachStdout: true, // to enable output streams
        AttachStderr: true, // to enable error streams
        Tty: false,
        OpenStdin: true // keep the input stream open even when no interaction is there

      });
      await container.start();
      this.pool.push(container);
    }
    console.log(`[ContainerPool] Initialized with ${this.poolSize} containers.`);
  }

  async acquire(): Promise<Docker.Container> {
    if (this.pool.length === 0) {
      throw new Error("No available containers in the pool");
    }
    return this.pool.pop() as Docker.Container; // Get a container from the pool
  }

  release(container: Docker.Container) {
    this.pool.push(container); // Return the container to the pool
  }
}

export default ContainerPool;
