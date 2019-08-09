const express = require("express");
const Sse = require("json-sse");
const bodyParser = require("body-parser");
const cors = require("cors");
const Sequelize = require("sequelize");

const databaseUrl = "postgresql://postgres:secret@localhost:5432/postgres";

const db = new Sequelize(databaseUrl);

db.sync({ force: false }).then(() => console.log("Database synced"));

const Message = db.define("message", {
  text: Sequelize.STRING,
  user: Sequelize.STRING
});

//const messages = ["Hello world from Carlos"];

//const data = JSON.stringify(messages);
const stream = new Sse();

const app = express();
const middleware = cors();
app.use(middleware);

const jsonParser = bodyParser.json();
app.use(jsonParser);

app.get("/stream", async (request, response) => {
  const messages = await Message.findAll();

  const data = JSON.stringify(messages);
  stream.updateInit(data);
  stream.init(request, response);
});

app.post("/message", async (request, response) => {
  const { message, user } = request.body;
  //messages.push(message);
  const entity = await Message.create({ text: message, user });

  const messages = await Message.findAll();

  const data = JSON.stringify(messages);

  sse.updateInit(data);
  sse.send(data);
  response.send(entity);
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`listening on port: ${port}`));
