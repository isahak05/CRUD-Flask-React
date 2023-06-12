"use strict";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { createClient } from "redis";
import mysql from "mysql2/promise";
//import { v4: uuidv4 } = require('uuid');
import { v4 as uuidv4 } from "uuid";

dotenv.config();
// environment variables
const expressPort = 5001;

// redis
const redisUrl = "redis://localhost:6379";
// mysql
const myTable = "exam_db";

console.log("hi");

// configs

const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root",
  database: "todo_db",
  port: "3307",
};

// const sqlConnection = await mysql.createConnection(dbConfig);
const redisClient = createClient({ url: redisUrl });
const sqlConnection = await mysql.createConnection(dbConfig);

// init database with data_init.sql file
const initDatabase = async () => {
  try {
    const sqlQuery = `CREATE TABLE IF NOT EXISTS ${myTable} (id VARCHAR(255), data VARCHAR(255))`;
    return sqlConnection.execute(sqlQuery);
  } catch (err) {
    console.log("error", err);
  }
};

initDatabase();

const getMysqlData = async () => {
  const sqlQuery = `SELECT data, id FROM ${myTable}`;
  return sqlConnection.execute(sqlQuery);
};

const createTodo = async (data) => {
  let guid = uuidv4().toString();
  console.log(guid);

  const sqlQuery = `INSERT INTO ${myTable} (id,data) VALUES('${guid}','${data}')`;

  return sqlConnection.execute(sqlQuery);
};

const deleteTodo = async (id) => {
  const sqlQuery = `DELETE FROM ${myTable} WHERE id = '${id}'`;
  return sqlConnection.execute(sqlQuery);
};

await redisClient.connect();
const setRedisData = async (jsonData) => {
  const value = JSON.stringify({ data: jsonData });
  await redisClient.set("key", value);
};

const getRedisData = async () => {
  try {
    const cachedData = await redisClient.get("key");
  } catch (err) {
    console.log(err);
  }
};

const deleteRedisData = async () => {
  await redisClient.del("key");
};

//express
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// express endpoints
app.get("/", (_, res) => res.status(200).send("connected to server 1!"));
app.get("/get", async (_, res) => {
  try {
    const data = await getRedisData();
    if (data) {
      res.status(200).json(JSON.parse(data));
      return;
    } else {
      const [data, _] = await getMysqlData();
      res.status(200).json({ data: data });
      return;
    }
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "failure", error });
  }
});

app.post("/create", async (req, res) => {
  const { data } = req.body;
  try {
    if (!data) throw new Error("missing data");
    await createTodo(data);
    const [mysqlData] = await getMysqlData();
    await deleteRedisData();
    await setRedisData(mysqlData);
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "failure", error });
  }
});

app.delete("/delete", async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) throw new Error("missing data");
    console.log(id);
    await deleteTodo(id);
    const [mysqlData] = await getMysqlData();
    await deleteRedisData();
    await setRedisData(mysqlData);
    res.status(200).json({ message: "success" });
  } catch (error) {
    console.log({ error });
    res.status(500).json({ message: "failure", error });
  }
});

app.listen(expressPort, async () => {
  console.log(`served on port ${expressPort}`);
});
