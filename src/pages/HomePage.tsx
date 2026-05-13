import {
  useRef,
  useState,
  type ChangeEvent,
  type SubmitEventHandler,
} from "react";
import { useToken } from "@/useToken";
import { useSeoMeta } from "@unhead/react";

import type { PostNumbersCheckResponse } from "@/api";
import { postNumbersCheck } from "@/api";
import NumberCheckResult from "@/components/NumberCheckResult";
import clsx from "clsx";

function HomePage() {
  useToken();
  useSeoMeta({
    title: "Номер на фото",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<PostNumbersCheckResponse | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files![0]); // Access the first file in the FileList

    const reader = new FileReader();
    reader.addEventListener("load", (ev) => {
      if (!imageRef.current) return;
      imageRef.current.src = ev.target?.result as string;
    });

    reader.readAsDataURL(event.target.files![0]);
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (!selectedFile) return;

    const { data } = await postNumbersCheck({
      body: {
        file: selectedFile,
      },
      bodySerializer: (body) => {
        const formData = new FormData();
        // @ts-expect-error do not expect the error here
        formData.set("file", body.file);
        return formData;
      },
      headers: {
        "Content-Type": null,
      },
    });

    // TODO: обработать
    if (typeof data === "undefined") return;
    setResult(data);
  };

  return (
    <div className="flex size-full items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-yellow-500 bg-yellow-400 px-6 py-2">
        <h1 className="text-2xl font-extrabold text-amber-700 text-shadow-amber-200 text-shadow-lg">
          Добро пожаловать!
        </h1>
        <form
          className="flex flex-col items-center justify-center gap-2"
          onSubmit={handleSubmit}
        >
          <label>
            <span className="cursor-pointer rounded-md border-2 border-blue-500 bg-blue-400 px-1 font-bold text-neutral-50 text-shadow-black text-shadow-xs">
              Выбрать картинку с номером
            </span>
            <input
              className="hidden"
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
            />
          </label>
          <img ref={imageRef} src="" alt="" />
          <button
            className={clsx(
              "flex w-fit cursor-pointer gap-2 rounded-md border-2 border-green-500 bg-green-400 px-1 font-bold text-neutral-50 text-shadow-black text-shadow-xs",
              { hidden: selectedFile === null },
            )}
            type="submit"
            disabled={selectedFile === null}
          >
            Узнать номер
          </button>
        </form>
        <NumberCheckResult result={result} />
      </div>
    </div>
  );
}

export default HomePage;
