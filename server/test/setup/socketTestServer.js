"use strict";

const http = require("http");
const app = require("../../src/app");
const { initSocket } = require("../../src/config/socket");

/**
 * Creates an ephemeral test server on a random port for socket testing.
 * @returns {Promise<{ server: http.Server, io: import('socket.io').Server, port: number, url: string, close: Function }>}
 */
function createSocketTestServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    const io = initSocket(server);

    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "string" ? 0 : address.port;
      const url = `http://127.0.0.1:${port}`;

      const close = () => {
        return new Promise((res) => {
          io.close();
          server.close(res);
        });
      };

      resolve({ server, io, port, url, close });
    });
  });
}

module.exports = { createSocketTestServer };
