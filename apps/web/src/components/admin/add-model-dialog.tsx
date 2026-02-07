import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import { invalidateAdminModels } from "./query-utils";

type AddModelDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type LLMModelProvider = "ollama" | "lmstudio" | "stable-diffusion" | "whisper";

export function AddModelDialog({ open, onOpenChange }: AddModelDialogProps) {
  const [identifier, setIdentifier] = useState("");
  const [provider, setProvider] = useState<LLMModelProvider>("ollama");
  const [creator, setCreator] = useState("");
  const [family, setFamily] = useState("");
  const [size, setSize] = useState("");
  const queryClient = useQueryClient();

  const addModelMutation = useMutation(
    orpc.admin.addModel.mutationOptions({
      onSuccess: async () => {
        await invalidateAdminModels(queryClient);
        toast.success(fa.admin.models.messages.modelAdded);
        handleReset();
        onOpenChange(false);
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(
          error,
          fa.admin.models.messages.errorAddingModel
        );
        toast.error(errorMessage);
      },
    })
  );

  const handleReset = () => {
    setIdentifier("");
    setProvider("ollama");
    setCreator("");
    setFamily("");
    setSize("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim()) {
      toast.error(fa.admin.models.messages.modelNameRequired);
      return;
    }

    addModelMutation.mutate({
      identifier: identifier.trim(),
      provider,
      creator: creator.trim() || undefined,
      family: family.trim() || undefined,
      size: size.trim() || undefined,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-right">
          <DialogTitle>{fa.admin.models.addDialog.title}</DialogTitle>
          <DialogDescription>
            {fa.admin.models.addDialog.description}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Identifier */}
          <div className="space-y-2">
            <Label htmlFor="identifier">
              {fa.admin.models.addDialog.modelName}
            </Label>
            <Input
              disabled={addModelMutation.isPending}
              id="identifier"
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={fa.admin.models.addDialog.modelNamePlaceholder}
              value={identifier}
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">
              {fa.admin.models.table.providerLabel}
            </Label>
            <Select
              disabled={addModelMutation.isPending}
              onValueChange={(value) => setProvider(value as LLMModelProvider)}
              value={provider}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama</SelectItem>
                <SelectItem value="lmstudio">LM Studio</SelectItem>
                <SelectItem value="stable-diffusion">
                  Stable Diffusion
                </SelectItem>
                <SelectItem value="whisper">Whisper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Creator */}
          <div className="space-y-2">
            <Label htmlFor="creator">{fa.admin.models.addDialog.creator}</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="creator"
              onChange={(e) => setCreator(e.target.value)}
              placeholder={fa.admin.models.addDialog.creatorPlaceholder}
              value={creator}
            />
          </div>

          {/* Family */}
          <div className="space-y-2">
            <Label htmlFor="family">{fa.admin.models.addDialog.family}</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="family"
              onChange={(e) => setFamily(e.target.value)}
              placeholder={fa.admin.models.addDialog.familyPlaceholder}
              value={family}
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size">{fa.admin.models.addDialog.size}</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="size"
              onChange={(e) => setSize(e.target.value)}
              placeholder={fa.admin.models.addDialog.sizePlaceholder}
              value={size}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-start gap-3 pt-4">
            <Button
              disabled={addModelMutation.isPending}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              {fa.admin.models.addDialog.cancel}
            </Button>
            <Button disabled={addModelMutation.isPending} type="submit">
              {addModelMutation.isPending
                ? fa.admin.models.addDialog.adding
                : fa.admin.models.addDialog.add}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
