import { useQuery } from "@tanstack/react-query";
import { useSeoMeta } from "@unhead/react";
import { getNumbers } from "@/api";
import { useToken } from "@/useToken";

function CarsPage() {
  useToken();
  useSeoMeta({
    title: "Номера",
  });
  const query = useQuery({
    queryKey: ["numbers"],
    queryFn: () =>
      getNumbers({
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
  });

  return (
    <div className="flex max-h-full justify-center overflow-scroll">
      <table>
        <thead>
          <tr>
            <th className="border-2 border-amber-900 px-2">Номер</th>
            <th className="border-2 border-amber-900 px-2">Машина</th>
            <th className="border-2 border-amber-900 px-2">Пользователь</th>
          </tr>
        </thead>
        <tbody>
          {query.data?.data?.map((number) => (
            <tr>
              <td className="border-2 border-amber-900 px-2">
                {number.number}
              </td>
              <td className="border-2 border-amber-900 px-2">{number.car}</td>
              <td className="border-2 border-amber-900 px-2">
                {number.userId}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CarsPage;
