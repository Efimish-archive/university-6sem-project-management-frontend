function App() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <div className="flex flex-col gap-4 bg-amber-200 p-4">
        <h1 className="text-2xl font-extrabold text-amber-700">
          Войдите в систему
        </h1>
        <input className="bg-amber-400" type="text" />
        <input className="bg-amber-400" type="text" />
      </div>
    </div>
  );
}

export default App;
