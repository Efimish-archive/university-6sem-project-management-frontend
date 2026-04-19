import { useState } from "react";
import { LogIn, Car, Van } from "lucide-react";

function App() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-amber-100">
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-yellow-500 bg-yellow-400 px-6 py-2">
        <h1 className="text-2xl font-extrabold text-amber-700 text-shadow-amber-200 text-shadow-lg">
          Войдите в систему
        </h1>
        <input
          className="rounded-md border-2 border-blue-500 bg-blue-400 px-1 font-bold text-neutral-50 text-shadow-black text-shadow-xs placeholder:text-neutral-200"
          type="text"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <input
          className="rounded-md border-2 border-blue-500 bg-blue-400 px-1 font-bold text-neutral-50 text-shadow-black text-shadow-xs placeholder:text-neutral-200"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex gap-2">
          <Car />
          <button className="flex w-fit cursor-pointer gap-2 rounded-md border-2 border-green-500 bg-green-400 px-1 font-bold text-neutral-50 text-shadow-black text-shadow-xs">
            <p>Войти</p>
            <LogIn />
          </button>
          <Van />
        </div>
      </div>
    </div>
  );
}

export default App;
