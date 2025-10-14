import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export function ModelsTable() {
  const queryClient = useQueryClient();

  const {
    data: models,
    isLoading,
    error,
  } = useQuery(orpc.admin.listAllModels.queryOptions());

  const toggleModelMutation = useMutation(
    orpc.admin.toggleModelStatus.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listAllModels.queryKey(),
        });
        toast.success(fa.admin.models.messages.statusUpdated);
      },
      onError: (err) => {
        console.error("Error toggling model status:", err);
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
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{fa.admin.models.title}</h3>
          <Badge variant="secondary">{models.length} مدل</Badge>
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
                    {model.name}
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
  );
}
