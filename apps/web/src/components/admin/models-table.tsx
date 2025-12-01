import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { AddModelDialog } from "./add-model-dialog";

type LLMModelProvider = "ollama" | "lmstudio" | "stable-diffusion" | "whisper";

export function ModelsTable() {
  const [addModelDialogOpen, setAddModelDialogOpen] = useState(false);
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

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          <p className="text-muted-foreground">در حال بارگذاری مدل‌ها...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          <p>خطا در بارگذاری مدل‌ها</p>
        </div>
      </Card>
    );
  }

  if (!models || models.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>هیچ مدلی یافت نشد</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">{fa.admin.models.title}</h3>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{models.length} مدل</Badge>
              <Button onClick={() => setAddModelDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                افزودن مدل
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select
              onValueChange={(value) =>
                setProviderFilter(value as LLMModelProvider | "all")
              }
              value={providerFilter}
            >
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="فیلتر بر اساس ارائه‌دهنده" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">تمام ارائه‌دهندگان</SelectItem>
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
                <SelectValue placeholder="فیلتر بر اساس وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">تمام وضعیت‌ها</SelectItem>
                <SelectItem value="enabled">فعال</SelectItem>
                <SelectItem value="disabled">غیرفعال</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                {models.map((model) => (
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
                      <Badge
                        variant={model.isEnabled ? "default" : "secondary"}
                      >
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
        </div>
      </Card>

      <AddModelDialog
        onOpenChange={setAddModelDialogOpen}
        open={addModelDialogOpen}
      />
    </>
  );
}
