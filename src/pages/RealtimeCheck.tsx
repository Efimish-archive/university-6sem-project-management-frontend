import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Camera, CircleStop, LoaderCircle, Play } from "lucide-react";
import clsx from "clsx";

import { postNumbersCheck } from "@/api";
import { useToken } from "@/useToken";

const CHECK_INTERVAL_MS = 500;

function RealtimeCheck() {
  useToken();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCheckingRef = useRef(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resultNumber, setResultNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraActive(false);
    setIsChecking(false);
    isCheckingRef.current = false;
  }, []);

  const startCamera = async () => {
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraActive(true);
    } catch {
      setErrorMessage("Не удалось получить доступ к камере");
    }
  };

  const checkCurrentFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return;
    }

    if (isCheckingRef.current) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (width === 0 || height === 0) return;

    isCheckingRef.current = true;
    setIsChecking(true);
    setErrorMessage(null);

    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        isCheckingRef.current = false;
        setIsChecking(false);
        return;
      }

      const file = new File([blob], "camera-frame.jpg", { type: "image/jpeg" });

      try {
        const { data } = await postNumbersCheck({
          body: { file },
          bodySerializer: (body) => {
            const formData = new FormData();
            // @ts-expect-error generated client types keep uploaded file unknown
            formData.set("file", body.file);
            return formData;
          },
          headers: {
            "Content-Type": null,
          },
        });

        if (typeof data !== "undefined") setResultNumber(data.number);
      } catch {
        setErrorMessage("Ошибка при отправке кадра на сервер");
      } finally {
        isCheckingRef.current = false;
        setIsChecking(false);
      }
    }, "image/jpeg");
  }, []);

  useEffect(() => {
    if (!isCameraActive) return;

    const interval = window.setInterval(checkCurrentFrame, CHECK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [checkCurrentFrame, isCameraActive]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-amber-100 px-4 py-6">
      <div className="flex w-full max-w-4xl flex-col gap-4 rounded-lg border-2 border-yellow-500 bg-yellow-400 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-amber-700 text-shadow-amber-200 text-shadow-lg">
              Определение номера в реальном времени
            </h1>
            <Link
              className="font-bold text-blue-700 underline underline-offset-2"
              to="/"
            >
              Проверить номер по картинке
            </Link>
          </div>
          <button
            className={clsx(
              "flex w-fit cursor-pointer items-center gap-2 rounded-md border-2 px-2 py-1 font-bold text-neutral-50 text-shadow-black text-shadow-xs",
              isCameraActive
                ? "border-red-500 bg-red-400"
                : "border-green-500 bg-green-400",
            )}
            type="button"
            onClick={isCameraActive ? stopCamera : startCamera}
          >
            {isCameraActive ? <CircleStop size={20} /> : <Play size={20} />}
            {isCameraActive ? "Остановить" : "Запустить"}
          </button>
        </div>

        <div className="overflow-hidden rounded-md border-2 border-neutral-900 bg-neutral-950">
          <video
            ref={videoRef}
            className="aspect-video w-full object-contain"
            muted
            playsInline
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-sm border-2 border-neutral-900 bg-neutral-50 px-2 py-1 font-bold">
            <Camera size={20} />
            {isCameraActive ? "Камера активна" : "Камера остановлена"}
          </div>
          <div className="flex items-center gap-2 rounded-sm border-2 border-neutral-900 bg-neutral-50 px-2 py-1 font-bold">
            <LoaderCircle
              className={clsx({ "animate-spin": isChecking })}
              size={20}
            />
            {isChecking ? "Идёт проверка" : "Ожидание кадра"}
          </div>
          <div
            className={clsx(
              "rounded-sm border-2 border-neutral-900 bg-neutral-50 px-2 py-1 font-bold",
              { hidden: resultNumber === null },
            )}
          >
            Номер: {resultNumber}
          </div>
          <div
            className={clsx(
              "rounded-sm border-2 border-red-700 bg-red-100 px-2 py-1 font-bold text-red-800",
              { hidden: errorMessage === null },
            )}
          >
            {errorMessage}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

export default RealtimeCheck;
