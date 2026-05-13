import { useSeoMeta } from "@unhead/react";
import { Link } from "react-router";
import { Home } from "lucide-react";

function NotFoundPage() {
  useSeoMeta({
    title: "Страница не найдена",
  });
  return (
    <div className="flex size-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 rounded-lg border-2 border-yellow-500 bg-yellow-400 px-6 py-2">
        <h1 className="text-2xl font-extrabold text-amber-700 text-shadow-amber-200 text-shadow-lg">
          <p>Страница не найдена :(</p>
          <p className="flex gap-2">
            Можете пройти
            <Link className="flex align-bottom text-blue-600" to="/">
              <Home size={30} /> домой <Home size={30} />
            </Link>
          </p>
        </h1>
      </div>
    </div>
  );
}

export default NotFoundPage;
