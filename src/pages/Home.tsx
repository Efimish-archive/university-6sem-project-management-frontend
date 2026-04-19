import { useToken } from "@/useToken";

function Home() {
  useToken();
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-amber-100">
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-yellow-500 bg-yellow-400 px-6 py-2">
        <h1 className="text-2xl font-extrabold text-amber-700 text-shadow-amber-200 text-shadow-lg">
          Добро пожаловать!
        </h1>
      </div>
    </div>
  );
}

export default Home;
