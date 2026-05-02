import { BadgeCheck, CarFront, CircleHelp, Sparkles, UserRound } from "lucide-react";
import clsx from "clsx";

import type { PostNumbersCheckResponse } from "@/api";

type NumberCheckResultProps = {
  result: PostNumbersCheckResponse | null;
};

function NumberCheckResult({ result }: NumberCheckResultProps) {
  if (result === null) return null;

  const fullName = result.info
    ? [
        result.info.user.lastName,
        result.info.user.firstName,
        result.info.user.middleName,
      ]
        .filter(Boolean)
        .join(" ")
    : null;

  return (
    <div
      className={clsx(
        "relative isolate w-full overflow-hidden rounded-lg border-2 p-4 font-bold shadow-[6px_6px_0_#111827]",
        result.isInDb
          ? "border-emerald-700 bg-lime-200 text-emerald-950"
          : "border-fuchsia-700 bg-pink-200 text-fuchsia-950",
      )}
    >
      <div className="absolute -right-10 -top-8 -z-10 h-28 w-28 rotate-12 rounded-full bg-cyan-300 opacity-70" />
      <div className="absolute -bottom-10 left-8 -z-10 h-24 w-24 -rotate-12 rounded-full bg-yellow-300 opacity-70" />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide">
            <Sparkles size={18} />
            {result.isInDb ? "База сказала: знакомый" : "База пожала плечами"}
          </div>
          <div className="mt-1 text-4xl font-extrabold text-shadow-white text-shadow-sm">
            {result.number}
          </div>
        </div>

        <div
          className={clsx(
            "flex rotate-2 items-center gap-2 rounded-md border-2 px-3 py-2 text-neutral-50 text-shadow-black text-shadow-xs",
            result.isInDb
              ? "border-emerald-900 bg-emerald-500"
              : "border-fuchsia-900 bg-fuchsia-500",
          )}
        >
          {result.isInDb ? <BadgeCheck size={22} /> : <CircleHelp size={22} />}
          {result.isInDb ? "Есть в базе" : "Незнакомец"}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border-2 border-neutral-900 bg-neutral-50 p-3">
          <div className="flex items-center gap-2 text-neutral-500">
            <CarFront size={18} />
            Автомобиль
          </div>
          <div className="mt-1 text-xl text-neutral-950">
            {result.info?.car ?? "Секретный болид"}
          </div>
        </div>

        <div className="rounded-md border-2 border-neutral-900 bg-neutral-50 p-3">
          <div className="flex items-center gap-2 text-neutral-500">
            <UserRound size={18} />
            Владелец
          </div>
          <div className="mt-1 text-xl text-neutral-950">
            {fullName ?? "Личность покрыта туманом"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default NumberCheckResult;
