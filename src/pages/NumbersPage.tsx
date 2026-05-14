import { memo, useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { useSeoMeta } from "@unhead/react";
import {
  deleteNumbersByNumber,
  getNumbers,
  getUsers,
  postNumbers,
  putNumbersByNumber,
  type GetNumbersResponse,
  type GetUsersResponse,
} from "@/api";
import { useToken } from "@/useToken";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/Combobox";
import { Plus, RotateCcw, Save, Trash2 } from "lucide-react";

type NumberRecord = GetNumbersResponse[number];
type UserRecord = GetUsersResponse[number];
type UserOption = {
  value: string;
  label: string;
};

type NumberDraft = {
  clientId: string;
  originalNumber: string | null;
  number: string;
  car: string;
  userId: string;
  hasChanges: boolean;
};

type EditableNumberField = "number" | "car" | "userId";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const createDraft = (numberRecord?: NumberRecord): NumberDraft => ({
  clientId: numberRecord
    ? `number-${numberRecord.number}`
    : `new-${crypto.randomUUID()}`,
  originalNumber: numberRecord?.number ?? null,
  number: numberRecord?.number ?? "",
  car: numberRecord?.car ?? "",
  userId: numberRecord?.userId.toString() ?? "",
  hasChanges: !numberRecord,
});

const toNumberBody = (numberRecord: NumberDraft) => {
  const userId = Number(numberRecord.userId);

  if (!Number.isInteger(userId)) {
    return null;
  }

  return {
    number: numberRecord.number.trim(),
    car: numberRecord.car.trim(),
    userId,
  };
};

const isValidNumber = (numberRecord: NumberDraft) =>
  numberRecord.number.trim() !== "" &&
  numberRecord.car.trim() !== "" &&
  Number.isInteger(Number(numberRecord.userId));

const isSameNumber = (draft: NumberDraft, numberRecord: NumberRecord) =>
  draft.number === numberRecord.number &&
  draft.car === numberRecord.car &&
  Number(draft.userId) === numberRecord.userId;

const getUserFullName = (user: UserRecord) =>
  [user.lastName, user.firstName, user.middleName].filter(Boolean).join(" ");

const getUserOption = (
  userId: string,
  userOptionsById: Map<string, UserOption>,
) =>
  userOptionsById.get(userId) ?? {
    value: userId,
    label: userId ? `ID ${userId}` : "Не выбран",
  };

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

type EditableNumberCellProps = {
  ariaLabel: string;
  clientId: string;
  field: EditableNumberField;
  inputMode?: "numeric";
  value: string;
  onCommit: (
    clientId: string,
    field: EditableNumberField,
    value: string,
  ) => void;
};

const EditableNumberCell = memo(function EditableNumberCell({
  ariaLabel,
  clientId,
  field,
  inputMode,
  value,
  onCommit,
}: EditableNumberCellProps) {
  const commit = useCallback(
    (nextValue: string) => {
      if (nextValue !== value) {
        onCommit(clientId, field, nextValue);
      }
    },
    [clientId, field, onCommit, value],
  );

  const reset = useCallback(
    (input: HTMLInputElement) => {
      input.value = value;
    },
    [value],
  );

  return (
    <Input
      aria-label={ariaLabel}
      className="min-w-32"
      defaultValue={value}
      inputMode={inputMode}
      onBlur={(event) => commit(event.currentTarget.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit(event.currentTarget.value);
          event.currentTarget.blur();
        }

        if (event.key === "Escape") {
          reset(event.currentTarget);
          event.currentTarget.blur();
        }
      }}
    />
  );
});

const renderEditableCell = (
  ariaLabel: string,
  field: EditableNumberField,
  numberRecord: NumberDraft,
  onCommit: EditableNumberCellProps["onCommit"],
  inputMode?: EditableNumberCellProps["inputMode"],
) => (
  <EditableNumberCell
    key={`${numberRecord.clientId}-${field}-${numberRecord[field]}`}
    ariaLabel={ariaLabel}
    clientId={numberRecord.clientId}
    field={field}
    inputMode={inputMode}
    value={numberRecord[field]}
    onCommit={onCommit}
  />
);

type UserComboboxCellProps = {
  clientId: string;
  value: string;
  userOptions: UserOption[];
  userOptionsById: Map<string, UserOption>;
  onCommit: (
    clientId: string,
    field: EditableNumberField,
    value: string,
  ) => void;
};

const UserComboboxCell = memo(function UserComboboxCell({
  clientId,
  value,
  userOptions,
  userOptionsById,
  onCommit,
}: UserComboboxCellProps) {
  const selectedUser = getUserOption(value, userOptionsById);

  return (
    <Combobox
      value={selectedUser}
      itemToStringLabel={(item) => item?.label ?? ""}
      itemToStringValue={(item) => item?.value ?? ""}
      isItemEqualToValue={(item, selectedItem) =>
        item.value === selectedItem.value
      }
      onValueChange={(nextUser) => {
        if (nextUser) {
          onCommit(clientId, "userId", nextUser.value);
        }
      }}
    >
      <ComboboxInput
        aria-label="Пользователь"
        className="min-w-56"
        placeholder="Выберите пользователя"
      />
      <ComboboxContent>
        <ComboboxEmpty>Пользователь не найден</ComboboxEmpty>
        <ComboboxList>
          {userOptions.map((userOption) => (
            <ComboboxItem key={userOption.value} value={userOption}>
              {userOption.label}
            </ComboboxItem>
          ))}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
});

function NumbersPage() {
  useToken();
  useSeoMeta({
    title: "Номера",
  });
  const queryClient = useQueryClient();
  const [newNumbers, setNewNumbers] = useState<NumberDraft[]>([]);
  const [editedNumbers, setEditedNumbers] = useState<
    Record<string, NumberDraft>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["numbers"],
    queryFn: () =>
      getNumbers({
        headers: authHeaders(),
        throwOnError: true,
      }),
  });
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () =>
      getUsers({
        headers: authHeaders(),
        throwOnError: true,
      }),
  });

  const saveMutation = useMutation({
    mutationFn: async (numberRecord: NumberDraft) => {
      const body = toNumberBody(numberRecord);

      if (!body) {
        throw new Error("ID пользователя должен быть целым числом");
      }

      if (numberRecord.originalNumber === null) {
        return postNumbers({
          body,
          headers: authHeaders(),
          throwOnError: true,
        });
      }

      return putNumbersByNumber({
        path: {
          number: numberRecord.originalNumber,
        },
        body,
        headers: authHeaders(),
        throwOnError: true,
      });
    },
    onMutate: (numberRecord) => {
      setErrorMessage(null);
      setSavingId(numberRecord.clientId);
    },
    onSuccess: (_result, numberRecord) => {
      setNewNumbers((currentNumbers) =>
        currentNumbers.filter(
          ({ clientId }) => clientId !== numberRecord.clientId,
        ),
      );
      setEditedNumbers((currentNumbers) => {
        if (numberRecord.originalNumber === null) {
          return currentNumbers;
        }

        const nextNumbers = { ...currentNumbers };
        delete nextNumbers[numberRecord.originalNumber];
        return nextNumbers;
      });
      void queryClient.invalidateQueries({ queryKey: ["numbers"] });
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
    },
    onSettled: () => {
      setSavingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (numberRecord: NumberDraft) => {
      if (numberRecord.originalNumber === null) {
        return numberRecord;
      }

      return deleteNumbersByNumber({
        path: {
          number: numberRecord.originalNumber,
        },
        headers: authHeaders(),
        throwOnError: true,
      });
    },
    onMutate: (numberRecord) => {
      setErrorMessage(null);
      setDeletingId(numberRecord.clientId);
    },
    onSuccess: (_result, numberRecord) => {
      setNewNumbers((currentNumbers) =>
        currentNumbers.filter(
          ({ clientId }) => clientId !== numberRecord.clientId,
        ),
      );
      setEditedNumbers((currentNumbers) => {
        if (numberRecord.originalNumber === null) {
          return currentNumbers;
        }

        const nextNumbers = { ...currentNumbers };
        delete nextNumbers[numberRecord.originalNumber];
        return nextNumbers;
      });

      if (numberRecord.originalNumber !== null) {
        void queryClient.invalidateQueries({ queryKey: ["numbers"] });
      }
    },
    onError: (error) => {
      setErrorMessage(getErrorMessage(error));
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });
  const { mutate: saveNumber } = saveMutation;
  const { mutate: deleteNumber } = deleteMutation;

  const updateNumber = useCallback(
    (clientId: string, field: EditableNumberField, value: string) => {
      setNewNumbers((currentNumbers) => {
        const hasNewNumber = currentNumbers.some(
          (numberRecord) => numberRecord.clientId === clientId,
        );

        if (!hasNewNumber) {
          return currentNumbers;
        }

        return currentNumbers.map((numberRecord) =>
          numberRecord.clientId === clientId
            ? { ...numberRecord, [field]: value, hasChanges: true }
            : numberRecord,
        );
      });
      setEditedNumbers((currentNumbers) => {
        const sourceNumber =
          Object.values(currentNumbers).find(
            (numberRecord) => numberRecord.clientId === clientId,
          ) ??
          query.data?.data.find(
            (numberRecord) => `number-${numberRecord.number}` === clientId,
          );
        const originalNumber = query.data?.data.find(
          (numberRecord) => `number-${numberRecord.number}` === clientId,
        );

        if (!sourceNumber) {
          return currentNumbers;
        }

        const draft =
          "originalNumber" in sourceNumber
            ? sourceNumber
            : createDraft(sourceNumber as NumberRecord);

        if (draft.originalNumber === null) {
          return currentNumbers;
        }

        const nextDraft = {
          ...draft,
          [field]: value,
          hasChanges: true,
        };

        if (originalNumber && isSameNumber(nextDraft, originalNumber)) {
          const nextNumbers = { ...currentNumbers };
          delete nextNumbers[draft.originalNumber];
          return nextNumbers;
        }

        return {
          ...currentNumbers,
          [draft.originalNumber]: nextDraft,
        };
      });
    },
    [query.data?.data],
  );

  const cancelNumberChanges = useCallback((numberRecord: NumberDraft) => {
    setErrorMessage(null);

    if (numberRecord.originalNumber === null) {
      setNewNumbers((currentNumbers) =>
        currentNumbers.filter(
          ({ clientId }) => clientId !== numberRecord.clientId,
        ),
      );
      return;
    }

    setEditedNumbers((currentNumbers) => {
      const nextNumbers = { ...currentNumbers };
      delete nextNumbers[numberRecord.originalNumber!];
      return nextNumbers;
    });
  }, []);

  const addNumber = useCallback(() => {
    setErrorMessage(null);
    setNewNumbers((currentNumbers) => [createDraft(), ...currentNumbers]);
  }, []);

  const numbers = useMemo(
    () => [
      ...newNumbers,
      ...(query.data?.data.map(
        (numberRecord) =>
          editedNumbers[numberRecord.number] ?? createDraft(numberRecord),
      ) ?? []),
    ],
    [editedNumbers, newNumbers, query.data?.data],
  );
  const getNumberRowId = useCallback(
    (numberRecord: NumberDraft) => numberRecord.clientId,
    [],
  );
  const userOptions = useMemo(
    () =>
      usersQuery.data?.data.map((user) => ({
        value: user.id.toString(),
        label: getUserFullName(user),
      })) ?? [],
    [usersQuery.data?.data],
  );
  const userOptionsById = useMemo(
    () =>
      new Map(
        userOptions.map(
          (userOption) => [userOption.value, userOption] as const,
        ),
      ),
    [userOptions],
  );

  const columns = useMemo<ColumnDef<NumberDraft>[]>(
    () => [
      {
        id: "actions",
        enableSorting: false,
        header: "",
        cell: ({ row }) => {
          const isSaving = savingId === row.original.clientId;
          const isDeleting = deletingId === row.original.clientId;
          const isBusy = isSaving || isDeleting;
          const hasChanges = row.original.hasChanges;
          const canSave = hasChanges && isValidNumber(row.original);

          return (
            <div className="flex justify-start gap-2">
              <Button
                aria-label="Сохранить номер"
                title="Сохранить"
                size="icon-sm"
                disabled={isBusy || !canSave}
                onClick={() => saveNumber(row.original)}
              >
                <Save />
              </Button>
              <Button
                aria-label="Отменить изменения"
                title="Отменить"
                size="icon-sm"
                variant="outline"
                disabled={isBusy || !hasChanges}
                onClick={() => cancelNumberChanges(row.original)}
              >
                <RotateCcw />
              </Button>
              <Button
                aria-label="Удалить номер"
                title="Удалить"
                size="icon-sm"
                variant="destructive"
                disabled={isBusy}
                onClick={() => deleteNumber(row.original)}
              >
                <Trash2 />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "number",
        header: "Номер",
        cell: ({ row }) =>
          renderEditableCell("Номер", "number", row.original, updateNumber),
      },
      {
        accessorKey: "car",
        header: "Машина",
        cell: ({ row }) =>
          renderEditableCell("Машина", "car", row.original, updateNumber),
      },
      {
        accessorKey: "userId",
        header: "Пользователь",
        sortingFn: (rowA, rowB) => {
          const userA = getUserOption(rowA.original.userId, userOptionsById);
          const userB = getUserOption(rowB.original.userId, userOptionsById);

          return userA.label.localeCompare(userB.label);
        },
        cell: ({ row }) =>
          usersQuery.isPending ? (
            <span className="text-sm text-muted-foreground">Загрузка...</span>
          ) : (
            <UserComboboxCell
              key={`${row.original.clientId}-user-${row.original.userId}`}
              clientId={row.original.clientId}
              value={row.original.userId}
              userOptions={userOptions}
              userOptionsById={userOptionsById}
              onCommit={updateNumber}
            />
          ),
      },
    ],
    [
      cancelNumberChanges,
      deletingId,
      deleteNumber,
      saveNumber,
      savingId,
      updateNumber,
      userOptions,
      userOptionsById,
      usersQuery.isPending,
    ],
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
        <h1 className="text-xl font-semibold">Номера</h1>
        <Button onClick={addNumber}>
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
          data={numbers}
          getRowId={getNumberRowId}
        />
      </div>
    </div>
  );
}

export default NumbersPage;
