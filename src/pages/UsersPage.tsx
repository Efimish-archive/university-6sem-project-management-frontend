import { useQuery } from "@tanstack/react-query";
import { useSeoMeta } from "@unhead/react";
import { getUsers } from "@/api";
import { useToken } from "@/useToken";
import { DataTable } from "@/components/DataTable";

function UsersPage() {
  useToken();
  useSeoMeta({
    title: "Пользователи",
  });
  const query = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      getUsers({
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
  });

  if (query.isPending) {
    return <div>Loading</div>;
  }

  if (query.isError) {
    return <div>Error</div>;
  }

  return (
    <div className="flex max-h-full justify-center overflow-scroll">
      <DataTable
        columns={[
          {
            accessorKey: "id",
            header: "ID",
          },
          {
            accessorKey: "lastName",
            header: "Фамилия",
          },
          {
            accessorKey: "firstName",
            header: "Имя",
          },
          {
            accessorKey: "middleName",
            header: "Отчество",
          },
        ]}
        data={query.data.data!}
      />
    </div>
  );
}

export default UsersPage;
