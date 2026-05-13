import { useQuery } from "@tanstack/react-query";
import { getUsers } from "@/api";
import { useToken } from "@/useToken";

function UsersPage() {
  useToken();
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      getUsers({
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
            <th className="border-2 border-amber-900 px-2">ID</th>
            <th className="border-2 border-amber-900 px-2">Фамилия</th>
            <th className="border-2 border-amber-900 px-2">Имя</th>
            <th className="border-2 border-amber-900 px-2">Отчество</th>
          </tr>
        </thead>
        <tbody>
          {query.data?.data?.map((user) => (
            <tr>
              <td className="border-2 border-amber-900 px-2">{user.id}</td>
              <td className="border-2 border-amber-900 px-2">
                {user.lastName}
              </td>
              <td className="border-2 border-amber-900 px-2">
                {user.firstName}
              </td>
              <td className="border-2 border-amber-900 px-2">
                {user.middleName}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsersPage;
