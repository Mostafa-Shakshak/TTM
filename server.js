require("dotenv").config();

const http = require("http");

const app = require("./src/app");
const initializeSocket = require("./src/socket");

const PORT = process.env.PORT || 5555;

const server = http.createServer(app);

const io = initializeSocket(server);

app.set('io', io);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
