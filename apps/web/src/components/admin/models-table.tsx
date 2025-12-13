import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fa } from "@/lib/persian-texts";
import { orpc } from "@/utils/orpc";
import { AdminTableShell } from "./table-shell";

type LLMModelProvider = "ollama" | "lmstudio" | "stable-diffusion" | "whisper";

export function ModelsTable() {
  const [providerFilter, setProviderFilter] = useState<
    LLMModelProvider | "all"
  >("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "enabled" | "disabled"
  >("all");
  const queryClient = useQueryClient();

  const {
    data: allModels,
    isLoading,
    error,
  } = useQuery(orpc.admin.listAllModels.queryOptions());

  // Filter models based on selected filters
  const models =
    allModels?.filter((model) => {
      const providerMatch =
        providerFilter === "all" || model.provider === providerFilter;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "enabled" && model.isEnabled) ||
        (statusFilter === "disabled" && !model.isEnabled);
      return providerMatch && statusMatch;
    }) ?? [];

  const toggleModelMutation = useMutation(
    orpc.admin.toggleModelStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listAllModels.queryKey(),
        });
        toast.success(fa.admin.models.messages.statusUpdated);
      },
      onError: () => {
        toast.error(fa.admin.models.messages.errorUpdatingStatus);
      },
    })
  );

  const handleToggleModel = (modelId: number, isEnabled: boolean) => {
    toggleModelMutation.mutate({
      modelId,
      isEnabled: !isEnabled,
    });
  };

  const getProviderLabel = (provider: string) => {
    switch (provider) {
      case "ollama":
        return fa.admin.models.providers.ollama;
      case "lmstudio":
        return fa.admin.models.providers.lmstudio;
      default:
        return provider;
    }
  };

  const isEmpty = !(isLoading || error) && (!models || models.length === 0);

  return (
    <>
      <AdminTableShell
        actions={null}
        badge={
          <Badge variant="secondary">
            {fa.admin.models.modelCount(models.length)}
          </Badge>
        }
        emptyMessage={fa.admin.models.notFound}
        errorMessage={fa.admin.models.errorLoading}
        filters={
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <Select
              onValueChange={(value) =>
                setProviderFilter(value as LLMModelProvider | "all")
              }
              value={providerFilter}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="ml-2 h-4 w-4" />
                <SelectValue
                  placeholder={fa.admin.models.table.filterByProvider}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {fa.admin.models.providers.allProviders}
                </SelectItem>
                <SelectItem value="ollama">Ollama</SelectItem>
                <SelectItem value="lmstudio">LM Studio</SelectItem>
                <SelectItem value="stable-diffusion">
                  Stable Diffusion
                </SelectItem>
                <SelectItem value="whisper">Whisper</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                setStatusFilter(value as "all" | "enabled" | "disabled")
              }
              value={statusFilter}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue
                  placeholder={fa.admin.models.table.filterByStatus}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {fa.admin.models.statuses.all}
                </SelectItem>
                <SelectItem value="enabled">
                  {fa.admin.models.statuses.enabled}
                </SelectItem>
                <SelectItem value="disabled">
                  {fa.admin.models.statuses.disabled}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        isEmpty={isEmpty}
        isError={Boolean(error)}
        isLoading={isLoading}
        loadingMessage={fa.admin.models.loading}
        title={fa.admin.models.title}
      >
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">
                  {fa.admin.models.table.toggle}
                </TableHead>
                <TableHead className="text-right">
                  {fa.admin.models.table.status}
                </TableHead>
                <TableHead className="text-right">
                  {fa.admin.models.table.provider}
                </TableHead>
                <TableHead className="text-right">
                  {fa.admin.models.table.name}
                </TableHead>
                <TableHead className="text-right">
                  {fa.admin.models.table.id}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models?.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="text-right">
                    <Switch
                      checked={model.isEnabled}
                      disabled={toggleModelMutation.isPending}
                      onCheckedChange={() =>
                        handleToggleModel(model.id, model.isEnabled)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={model.isEnabled ? "default" : "secondary"}>
                      {model.isEnabled
                        ? fa.admin.models.table.enabled
                        : fa.admin.models.table.disabled}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">
                      {getProviderLabel(model.provider)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {model.identifier}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {model.id}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminTableShell>

    </>
  );
}
