const express = require("express");
const serverInstance = express();
serverInstance.use(express.json());
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const dataBasePath = path.join(__dirname, "todoApplication.db");
let dataBase_Path = null;

const initializeDataBaseAndSever = async () => {
  try {
    dataBase_Path = await open({
      filename: dataBasePath,
      driver: sqlite3.Database,
    });
    serverInstance.listen(5000, () => {
      console.log("Server is running on 5000 port");
    });
  } catch (Error) {
    console.log(`Database Error ${Error.message}`);
    process.exit(1);
  }
};

initializeDataBaseAndSever();

const statusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const priorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const statusPriorityProperty = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};

//  GET API 1

serverInstance.get(`/todos/`, async (request, response) => {
  const requestQuery = request.query;
  const { priority, status, search_q = "" } = requestQuery;
  let getAllTodo = "";

  // GET API 1 (Returns a list of all todos whose status is 'TO DO')

  if (statusProperty(requestQuery)) {
    getAllTodo = `SELECT * FROM todo WHERE status = '${status}';`;
  }

  //  GET API 1 (Returns a list of all todos whose priority is 'HIGH')
  //
  else if (priorityProperty(requestQuery)) {
    getAllTodo = `SELECT * FROM todo WHERE priority ='${priority}';`;
  }

  //  GET API 1 (Returns a list of all todos whose priority is 'HIGH' and status is 'IN PROGRESS')
  //
  else if (statusPriorityProperty(requestQuery)) {
    getAllTodo = `SELECT * FROM todo WHERE status = '${status}' AND priority = '${priority}';`;
  }

  //  GET API 1 (Returns a list of all todos whose todo contains 'Play' text)
  //
  else {
    getAllTodo = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
  }

  const dbRun = await dataBase_Path.all(getAllTodo);
  response.send(dbRun);
});

// GET API 2 (Returns a specific todo based on the todo ID)
serverInstance.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const runQueryOnSQL = `SELECT * FROM todo WHERE id = '${todoId}';`;
  const getTodoSpecificDetail = await dataBase_Path.get(runQueryOnSQL);
  response.send(getTodoSpecificDetail);
});

// POST API 3 (Create a todo in the todo table)
serverInstance.post("/todos/", async (request, response) => {
  const request_body = request.body;
  const { id, todo, priority, status } = request_body;
  const insertDataSQL = `INSERT INTO todo 
  (id, todo, priority, status)
  VALUES 
  ('${id}', '${todo}', '${priority}', '${status}');`;
  await dataBase_Path.run(insertDataSQL);
  response.send("Todo Successfully Added");
});

// PUT API 4 (Updates the details of a specific todo based on the todo ID)
serverInstance.put(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumnName = "";
  if (requestBody.todo !== undefined) {
    updatedColumnName = "Todo";
  } else if (requestBody.priority !== undefined) {
    updatedColumnName = "Priority";
  } else if (requestBody.status !== undefined) {
    updatedColumnName = "Status";
  }
  const previousTodoTableData = `SELECT * FROM todo WHERE id = ${todoId}`;
  const previousTableData = await dataBase_Path.get(previousTodoTableData);
  const {
    todo = previousTableData.todo,
    priority = previousTableData.priority,
    status = previousTableData.status,
  } = request.body;
  const updateTable = `UPDATE todo 
  SET 
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  WHERE 
  id = ${todoId};`;
  await dataBase_Path.run(updateTable);
  response.send(`${updatedColumnName} Updated`);
});

// DELETE API 5 (Deletes a todo from the todo table based on the todo ID)
serverInstance.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const DeleteSpecificTable = `DELETE from todo WHERE id = ${todoId};`;
  await dataBase_Path.run(DeleteSpecificTable);
  response.send("Todo Deleted");
});

module.exports = serverInstance;
