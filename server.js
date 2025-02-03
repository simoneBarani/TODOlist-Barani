const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const fs = require("fs");
const mysql = require("mysql");

const conf = JSON.parse(fs.readFileSync("conf.json"));
const connection = mysql.createConnection(conf);

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static(path.join(__dirname, "public")));

const executeQuery = (sql) => {
  return new Promise((resolve, reject) => {
    connection.query(sql, function (err, result) {
      if (err) {
        console.error(err);
        reject(err);
      }
      resolve(result);
    });
  });
};

const createTable = () => {
  return executeQuery(`
    CREATE TABLE IF NOT EXISTS todo (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      completed BOOLEAN
    )
  `);
};

const insert = (todo) => {
  const sql = `INSERT INTO todo (name, completed) VALUES ('${todo.name}', ${todo.completed ? 1 : 0})`;
  return executeQuery(sql);
};

const select = () => {
  const sql = `SELECT id, name, completed FROM todo`;
  return executeQuery(sql);
};

const update = (todo) => {
  const sql = `UPDATE todo SET completed = ${todo.completed ? 1 : 0} WHERE id = ${todo.id}`;
  return executeQuery(sql);
};

const deleteDB = (id) => {
  const sql = `DELETE FROM todo WHERE id = ${id}`;
  return executeQuery(sql);
};

app.post("/todo/add", async (req, res) => {
  try {
    const todo = req.body;
    await insert(todo);
    res.json({ result: "Ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/todo", async (req, res) => {
  try {
    const todos = await select();
    res.json({ todos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/todo/complete", async (req, res) => {
  try {
    const todo = req.body;
    await update(todo);
    res.json({ result: "Ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/todo/:id", async (req, res) => {
  try {
    await deleteDB(req.params.id);
    res.json({ result: "Ok" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = http.createServer(app);

server.listen(80, async () => {
  console.log("- server running");
  await createTable();
});
