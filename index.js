const express = require("express");
const Sse = require("json-sse");
const bodyParser = require("body-parser");
const cors = require("cors");
const Sequelize = require("sequelize");
const axios = require("axios").default;
const uuidv4 = require("uuid/v4");

const databaseUrl =
  process.env.DATABASE_URL ||
  "postgresql://postgres:secret@localhost:5432/postgres";

const db = new Sequelize(databaseUrl);

db.sync({ force: false }).then(() => console.log("Database synced"));

const Message = db.define("message", {
  text: Sequelize.STRING,
  user: Sequelize.STRING,
});

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

var subscriptionKey = "INSERT_KEY_HERE";
var endpoint = "https://api.cognitive.microsofttranslator.com";

app.post("/message", async (request, response) => {
  const { message, user } = request.body;

  const newmessage = await axios({
    baseURL: endpoint,
    url: "/translate",
    method: "post",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-type": "application/json",
      "X-ClientTraceId": uuidv4().toString(),
    },
    params: {
      "api-version": "3.0",
      from: "en",
      to: ["es"],
    },
    data: [
      {
        text: message,
      },
    ],
    responseType: "json",
  }).then(function (res) {
    //console.log(JSON.stringify(response.data, null, 4));
    const trad = res.data[0].translations[0].text;

    return trad;
  });
  console.log(newmessage);

  const entity = await Message.create({ text: newmessage, user });

  const messages = await Message.findAll();

  const data = JSON.stringify(messages);

  stream.updateInit(data);
  stream.send(data);
  response.send(entity);
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`listening on port: ${port}`));
