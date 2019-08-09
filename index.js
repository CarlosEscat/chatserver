const express = require("express");
const Sse = require("json-sse");
const bodyParser = require("body-parser");
const cors = require("cors");

const messages = ["Hello world from Carlos"];

const data = JSON.stringify(messages);
const sse = new Sse(data);

const app = express();
const middleware = cors();
app.use(middleware);

const jsonParser = bodyParser.json();
app.use(jsonParser);
app.get("/stream", sse.init);

app.post("/message", (request, response) => {
  const { message } = request.body;
  messages.push(message);

  const data = JSON.stringify(messages);

  sse.updateInit(data);
  sse.send(data);
  response.send(message);
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`listening on port: ${port}`));
