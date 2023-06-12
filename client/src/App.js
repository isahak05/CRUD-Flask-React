import "./App.css";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [todoList, setToDoList] = useState();
  const baseUrl = "http://localhost:5001";
  const getTodoUrl = `${baseUrl}/get`;
  const createTodoUrl = `${baseUrl}/create`;
  const deleteTodoUrl = `${baseUrl}/delete`;

  const getData = useCallback(async () => {
    try {
      const { data } = await axios.get(getTodoUrl);
      return data;
    } catch (error) {
      console.error({ message: "failed fetching Todo.", error });
    }
  }, [getTodoUrl]);

  const createData = async (inputText) => {
    try {
      const { data } = await axios.post(createTodoUrl, { data: inputText });
      console.log({ message: "posted data", data });
      return data;
    } catch (error) {
      console.error({ message: "failed creating data.", error });
    }
  };

  const deleteTodo = async (id) => {
    try {
      const { data } = await axios.delete(deleteTodoUrl, { data: { id } });
      console.log({ message: "deleted data", data });
      return data;
    } catch (error) {
      console.error({ message: "failed deleting data.", error });
    }
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    await createData(input);
    const list = await getData();
    setToDoList(list.data);
    setInput("");
  };

  useEffect(() => {
    if (!todoList) {
      getData().then((res) => {
        setToDoList(res.data);
      });
    }
  }, [getData, todoList]);

  console.log(todoList);

  return (
    <main>
      <section className="p-5 flex justify-center items-center flex-col">
        <h4 className="text-center text-2xl font-bold">Todo List</h4>
        <form
          className="border-blue-400 border rounded p-4 mt-4 w-[80vw] max-w-[400px]"
          onSubmit={handleSubmit}
        >
          {/* Add todo list create form with buitiful design with tailwind css */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Title"
            className="border rounded h-10 w-full p-3 border-blue-950"
          />
          <button
            type="submit"
            className="bg-blue-950 text-white rounded h-10 w-full mt-4"
          >
            Create
          </button>
        </form>
      </section>
      <section className="mx-auto border-blue-400 border rounded p-4 mt-4 w-[80vw] max-w-[400px]">
        {todoList?.map((item) => (
          <div className="flex p-3 justify-between items-center border-b-2 border-blue-950 py-2">
            <p className="text-lg font-bold">{item.data}</p>
            <button
              onClick={() => {
                deleteTodo(item.id);
              }}
              className="bg-red-500 text-white rounded h-8 w-8"
            >
              X
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}

export default App;
