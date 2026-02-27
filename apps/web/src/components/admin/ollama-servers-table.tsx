import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import {
  invalidateAdminModels,
  invalidateAdminOllamaServers,
} from "./query-utils";
import { AdminTableShell } from "./table-shell";

type FormState = {
  id: number | null;
  name: string;
  baseUrl: string;
  isEnabled: boolean;
};

const emptyForm: FormState = {
  id: null,
  name: "",
  baseUrl: "",
  isEnabled: true,
};

export function OllamaServersTable() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: servers,
    isLoading,
    error,
    refetch,
  } = useQuery(orpc.admin.listOllamaServers.queryOptions());

  const resetForm = () => setForm(emptyForm);

  const invalidateData = async () => {
    await Promise.all([
      invalidateAdminOllamaServers(queryClient),
      invalidateAdminModels(queryClient),
    ]);
  };

  const showServerError = () => {
    toast.error(fa.admin.ollamaServers.messages.error);
  };

  const onServerMutationSuccess = async (message: string) => {
    await invalidateData();
    toast.success(message);
  };

  const createMutation = useMutation(
    orpc.admin.createOllamaServer.mutationOptions({
      onSuccess: async () => {
        await onServerMutationSuccess(fa.admin.ollamaServers.messages.created);
        resetForm();
      },
      onError: showServerError,
    })
  );

  const updateMutation = useMutation(
    orpc.admin.updateOllamaServer.mutationOptions({
      onSuccess: async () => {
        await onServerMutationSuccess(fa.admin.ollamaServers.messages.updated);
        resetForm();
      },
      onError: showServerError,
    })
  );

  const deleteMutation = useMutation(
    orpc.admin.deleteOllamaServer.mutationOptions({
      onSuccess: async () => {
        await onServerMutationSuccess(fa.admin.ollamaServers.messages.deleted);
      },
      onError: showServerError,
    })
  );

  const syncMutation = useMutation(
    orpc.admin.syncOllamaServerModels.mutationOptions({
      onSuccess: async () => {
        await onServerMutationSuccess(fa.admin.ollamaServers.messages.synced);
      },
      onError: showServerError,
    })
  );

  const syncAllMutation = useMutation(
    orpc.admin.syncAllOllamaServersModels.mutationOptions({
      onSuccess: async () => {
        await onServerMutationSuccess(fa.admin.ollamaServers.messages.synced);
      },
      onError: showServerError,
    })
  );

  const testMutation = useMutation(
    orpc.admin.testOllamaServerConnection.mutationOptions({
      onSuccess: (result) => {
        if (result.ok) {
          toast.success(fa.admin.ollamaServers.messages.testedOk);
          return;
        }
        const readableError = getErrorMessage(
          result.error,
          fa.admin.ollamaServers.messages.error
        );
        toast.error(
          `${fa.admin.ollamaServers.messages.testedFailed}: ${readableError}`
        );
      },
      onError: showServerError,
    })
  );

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    syncMutation.isPending ||
    syncAllMutation.isPending ||
    testMutation.isPending;

  const serverCount = servers?.length ?? 0;

  const sortedServers = useMemo(
    () => [...(servers ?? [])].sort((a, b) => a.id - b.id),
    [servers]
  );

  const handleSave = () => {
    if (!(form.name.trim() && form.baseUrl.trim())) {
      toast.error(fa.admin.ollamaServers.messages.error);
      return;
    }

    if (form.id === null) {
      createMutation.mutate({
        name: form.name,
        baseUrl: form.baseUrl,
        isEnabled: form.isEnabled,
      });
      return;
    }

    updateMutation.mutate({
      id: form.id,
      name: form.name,
      baseUrl: form.baseUrl,
      isEnabled: form.isEnabled,
    });
  };

  return (
    <AdminTableShell
      actions={
        <div className="flex items-center gap-2">
          <Button
            disabled={syncAllMutation.isPending}
            onClick={() => syncAllMutation.mutate(undefined)}
            size="sm"
            type="button"
            variant="outline"
          >
            {fa.admin.ollamaServers.syncAll}
          </Button>
          <Button
            onClick={() => refetch()}
            size="sm"
            type="button"
            variant="outline"
          >
            {fa.admin.ollamaServers.refresh}
          </Button>
        </div>
      }
      badge={<Badge variant="secondary">{serverCount} سرور</Badge>}
      emptyMessage={fa.admin.ollamaServers.notFound}
      errorMessage={fa.admin.ollamaServers.messages.error}
      isEmpty={!(isLoading || error) && serverCount === 0}
      isError={Boolean(error)}
      isLoading={isLoading}
      loadingMessage={fa.admin.ollamaServers.loading}
      title={fa.admin.ollamaServers.title}
    >
      <div className="space-y-4 p-4" dir="rtl">
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder={fa.admin.ollamaServers.form.name}
            value={form.name}
          />
          <Input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                baseUrl: event.target.value,
              }))
            }
            placeholder={fa.admin.ollamaServers.form.baseUrl}
            value={form.baseUrl}
          />
          <div className="flex items-center gap-2 text-sm">
            <Switch
              checked={form.isEnabled}
              onCheckedChange={(checked) =>
                setForm((current) => ({ ...current, isEnabled: checked }))
              }
            />
            {fa.admin.ollamaServers.form.enabled}
          </div>
          <div className="flex items-center gap-2">
            <Button disabled={isMutating} onClick={handleSave} type="button">
              {fa.admin.ollamaServers.form.save}
            </Button>
            {form.id !== null ? (
              <Button
                disabled={isMutating}
                onClick={resetForm}
                type="button"
                variant="outline"
              >
                {fa.admin.ollamaServers.form.cancel}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-md border">
          <Table dir="rtl">
            <TableHeader>
              <TableRow>
                <TableHead>
                  {fa.admin.ollamaServers.table.name}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.baseUrl}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.status}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.modelCount}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.inFlight}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.running}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.busyScore}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.latency}
                </TableHead>
                <TableHead>
                  {fa.admin.ollamaServers.table.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedServers.map((server) => (
                <TableRow key={server.id}>
                  <TableCell className="font-medium">
                    {server.name}
                  </TableCell>
                  <TableCell className="text-xs">
                    {server.baseUrl}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={server.isEnabled ? "default" : "secondary"}
                      >
                        {server.isEnabled
                          ? fa.admin.ollamaServers.status.enabled
                          : fa.admin.ollamaServers.status.disabled}
                      </Badge>
                      <Badge
                        variant={
                          server.runtime.reachable ? "secondary" : "destructive"
                        }
                      >
                        {server.runtime.reachable
                          ? fa.admin.ollamaServers.status.reachable
                          : fa.admin.ollamaServers.status.unreachable}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {server.modelCount}
                  </TableCell>
                  <TableCell>
                    {server.runtime.inFlight}
                  </TableCell>
                  <TableCell>
                    {server.runtime.runningModels}
                  </TableCell>
                  <TableCell>
                    {server.runtime.busyScore.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {server.runtime.ewmaLatencyMs}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={server.isEnabled}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({
                            id: server.id,
                            isEnabled: checked,
                          })
                        }
                      />
                      <Button
                        disabled={isMutating}
                        onClick={() =>
                          setForm({
                            id: server.id,
                            name: server.name,
                            baseUrl: server.baseUrl,
                            isEnabled: server.isEnabled,
                          })
                        }
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {fa.admin.ollamaServers.actions.edit}
                      </Button>
                      <Button
                        disabled={isMutating}
                        onClick={() => syncMutation.mutate({ id: server.id })}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {fa.admin.ollamaServers.actions.sync}
                      </Button>
                      <Button
                        disabled={isMutating}
                        onClick={() => testMutation.mutate({ id: server.id })}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        {fa.admin.ollamaServers.actions.test}
                      </Button>
                      <Button
                        disabled={isMutating}
                        onClick={() => deleteMutation.mutate({ id: server.id })}
                        size="sm"
                        type="button"
                        variant="destructive"
                      >
                        {fa.admin.ollamaServers.actions.delete}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminTableShell>
  );
}
