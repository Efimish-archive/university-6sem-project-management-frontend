import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useSeoMeta } from "@unhead/react";
import {
  deleteUsersById,
  getUsers,
  postUsers,
  putUsersById,
  type GetUsersResponse,
  type PostUsersData,
} from "@/api";
import { useToken } from "@/useToken";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";

type User = GetUsersResponse[number];

type UserDraft = {
  clientId: string;
  originalId: number | null;
  id: number | null;
  lastName: string;
  firstName: string;
  middleName: string;
  hasChanges: boolean;
};

type EditableUserField = "lastName" | "firstName" | "middleName";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const createDraft = (user?: User): UserDraft => ({
  clientId: user ? `user-${user.id}` : `new-${crypto.randomUUID()}`,
  originalId: user?.id ?? null,
  id: user?.id ?? null,
  lastName: user?.lastName ?? "",
  firstName: user?.firstName ?? "",
  middleName: user?.middleName ?? "",
  hasChanges: !user,
});

const toCreateUserBody = (user: UserDraft) =>
  ({
    lastName: user.lastName.trim(),
    firstName: user.firstName.trim(),
    middleName: user.middleName.trim(),
  }) as PostUsersData["body"];

const toUpdateUserBody = (user: UserDraft) => ({
  lastName: user.lastName.trim(),
  firstName: user.firstName.trim(),
  middleName: user.middleName.trim(),
});

const isValidUser = (user: UserDraft) =>
  user.lastName.trim() !== "" &&
  user.firstName.trim() !== "" &&
  user.middleName.trim() !== "";

const isSameUser = (draft: UserDraft, user: User) =>
  draft.lastName === user.lastName &&
  draft.firstName === user.firstName &&
  draft.middleName === user.middleName;

const getErrorMessage = (error: unknown) => {
  if (error && typeof error === "object" && "error" in error) {
    const apiError = error as { error?: unknown };

    if (typeof apiError.error === "string") {
      return apiError.error;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Не удалось выполнить операцию";
};

function UsersPage() {
  useToken();
  useSeoMeta({
    title: "Пользователи",
  });
  const queryClient = useQueryClient();
  const [newUsers, setNewUsers] = useState<UserDraft[]>([]);
  const [editedUsers, setEditedUsers] = useState<Record<number, UserDraft>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      getUsers({
        headers: authHeaders(),
        throwOnError: true,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async (user: UserDraft) => {
      if (user.originalId === null) {
        return postUsers({
          body: toCreateUserBody(user),
          headers: authHeaders(),
          throwOnError: true,
        });
      }

      return putUsersById({
        path: {
          id: user.originalId,
        },
        body: toUpdateUserBody(user),
        headers: authHeaders(),
        throwOnError: true,
      });
    },
    onMutate: (user) => {
      setErrorMessage(null);
      setSavingId(user.clientId);
    },
    onSuccess: (_result, user) => {
      setNewUsers((currentUsers) =>
        currentUsers.filter(({ clientId }) => clientId !== user.clientId),
      );
      setEditedUsers((currentUsers) => {
        if (user.originalId === null) {
          return currentUsers;
        }

        const nextUsers = { ...currentUsers };
        delete nextUsers[user.originalId];
        return nextUsers;
      });
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
    },
    onSettled: () => {
      setSavingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (user: UserDraft) => {
      if (user.originalId === null) {
        return user;
      }

      return deleteUsersById({
        path: {
          id: user.originalId,
        },
        headers: authHeaders(),
        throwOnError: true,
      });
    },
    onMutate: (user) => {
      setErrorMessage(null);
      setDeletingId(user.clientId);
    },
    onSuccess: (_result, user) => {
      setNewUsers((currentUsers) =>
        currentUsers.filter(({ clientId }) => clientId !== user.clientId),
      );
      setEditedUsers((currentUsers) => {
        if (user.originalId === null) {
          return currentUsers;
        }

        const nextUsers = { ...currentUsers };
        delete nextUsers[user.originalId];
        return nextUsers;
      });

      if (user.originalId !== null) {
        void queryClient.invalidateQueries({ queryKey: ["users"] });
      }
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });
  const { mutate: saveUser } = saveMutation;
  const { mutate: deleteUser } = deleteMutation;

  const updateUser = useCallback(
    (clientId: string, field: EditableUserField, value: string) => {
      setNewUsers((currentUsers) => {
        const hasNewUser = currentUsers.some(
          (user) => user.clientId === clientId,
        );

        if (!hasNewUser) {
          return currentUsers;
        }

        return currentUsers.map((user) =>
          user.clientId === clientId ? { ...user, [field]: value } : user,
        );
      });
      setEditedUsers((currentUsers) => {
        const sourceUser =
          Object.values(currentUsers).find(
            (user) => user.clientId === clientId,
          ) ?? query.data?.data.find((user) => `user-${user.id}` === clientId);
        const originalUser = query.data?.data.find(
          (user) => `user-${user.id}` === clientId,
        );

        if (!sourceUser) {
          return currentUsers;
        }

        const draft =
          "originalId" in sourceUser
            ? sourceUser
            : createDraft(sourceUser as User);

        if (draft.originalId === null) {
          return currentUsers;
        }

        const nextDraft = {
          ...draft,
          [field]: value,
          hasChanges: true,
        };

        if (originalUser && isSameUser(nextDraft, originalUser)) {
          const nextUsers = { ...currentUsers };
          delete nextUsers[draft.originalId];
          return nextUsers;
        }

        return {
          ...currentUsers,
          [draft.originalId]: nextDraft,
        };
      });
    },
    [query.data?.data],
  );

  const cancelUserChanges = useCallback((user: UserDraft) => {
    setErrorMessage(null);

    if (user.originalId === null) {
      setNewUsers((currentUsers) =>
        currentUsers.filter(({ clientId }) => clientId !== user.clientId),
      );
      return;
    }

    setEditedUsers((currentUsers) => {
      const nextUsers = { ...currentUsers };
      delete nextUsers[user.originalId!];
      return nextUsers;
    });
  }, []);

  const addUser = useCallback(() => {
    setErrorMessage(null);
    setNewUsers((currentUsers) => [createDraft(), ...currentUsers]);
  }, []);

  const users = useMemo(
    () => [
      ...newUsers,
      ...(query.data?.data.map(
        (user) => editedUsers[user.id] ?? createDraft(user),
      ) ?? []),
    ],
    [editedUsers, newUsers, query.data?.data],
  );
  const getUserRowId = useCallback((user: UserDraft) => user.clientId, []);

  const columns = useMemo<ColumnDef<UserDraft>[]>(
    () => [
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const isSaving = savingId === row.original.clientId;
          const isDeleting = deletingId === row.original.clientId;
          const isBusy = isSaving || isDeleting;
          const hasChanges = row.original.hasChanges;
          const canSave = hasChanges && isValidUser(row.original);

          return (
            <div className="flex justify-start gap-2">
              <Button
                aria-label="Сохранить пользователя"
                title="Сохранить"
                size="icon-sm"
                disabled={isBusy || !canSave}
                onClick={() => saveUser(row.original)}
              >
                <Save />
              </Button>
              <Button
                aria-label="Отменить изменения"
                title="Отменить"
                size="icon-sm"
                variant="outline"
                disabled={isBusy || !hasChanges}
                onClick={() => cancelUserChanges(row.original)}
              >
                <RotateCcw />
              </Button>
              <Button
                aria-label="Удалить пользователя"
                title="Удалить"
                size="icon-sm"
                variant="destructive"
                disabled={isBusy}
                onClick={() => deleteUser(row.original)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="block w-16 text-sm text-muted-foreground">
            {row.original.id ?? "Новый"}
          </span>
        ),
      },
      {
        accessorKey: "lastName",
        header: "Фамилия",
        cell: ({ row }) => (
          <input
            aria-label="Фамилия"
            className="h-8 min-w-36 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            value={row.original.lastName}
            onChange={(event) =>
              updateUser(row.original.clientId, "lastName", event.target.value)
            }
          />
        ),
      },
      {
        accessorKey: "firstName",
        header: "Имя",
        cell: ({ row }) => (
          <input
            aria-label="Имя"
            className="h-8 min-w-36 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            value={row.original.firstName}
            onChange={(event) =>
              updateUser(row.original.clientId, "firstName", event.target.value)
            }
          />
        ),
      },
      {
        accessorKey: "middleName",
        header: "Отчество",
        cell: ({ row }) => (
          <input
            aria-label="Отчество"
            className="h-8 min-w-36 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            value={row.original.middleName}
            onChange={(event) =>
              updateUser(
                row.original.clientId,
                "middleName",
                event.target.value,
              )
            }
          />
        ),
      },
    ],
    [cancelUserChanges, deletingId, deleteUser, saveUser, savingId, updateUser],
  );

  if (query.isPending) {
    return <div className="p-4 text-sm text-muted-foreground">Загрузка...</div>;
  }

  if (query.isError) {
    return (
      <div className="p-4 text-sm text-destructive">
        {getErrorMessage(query.error)}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-2rem)] min-h-0 flex-col gap-3 overflow-hidden">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Пользователи</h1>
        <Button onClick={addUser}>
          <Plus />
          Добавить
        </Button>
      </div>

      {errorMessage ? (
        <div className="mx-auto w-full max-w-4xl rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="mx-auto min-h-0 w-full max-w-4xl flex-1">
        <DataTable
          className="max-h-full overflow-auto bg-background"
          columns={columns}
          data={users}
          getRowId={getUserRowId}
        />
      </div>
    </div>
  );
}

export default UsersPage;
