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
import { orpc } from "@/utils/orpc";

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
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.admin.listAllModels.queryKey(),
        });
        toast.success("مدل با موفقیت اضافه شد");
        handleReset();
        onOpenChange(false);
      },
      onError: (error) => {
        const errorMessage = getErrorMessage(error, "خطا در اضافه کردن مدل");
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
      toast.error("لطفاً نام مدل را وارد کنید");
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
        <DialogHeader>
          <DialogTitle>افزودن مدل جدید</DialogTitle>
          <DialogDescription>
            مدل جدید را برای استفاده در سیستم ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Identifier */}
          <div className="space-y-2">
            <Label htmlFor="identifier">نام مدل *</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="identifier"
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="مثال: llama2, mistral-7b"
              value={identifier}
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">ارائه‌دهنده *</Label>
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
            <Label htmlFor="creator">سازنده</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="creator"
              onChange={(e) => setCreator(e.target.value)}
              placeholder="مثال: Meta, Mistral"
              value={creator}
            />
          </div>

          {/* Family */}
          <div className="space-y-2">
            <Label htmlFor="family">خانواده</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="family"
              onChange={(e) => setFamily(e.target.value)}
              placeholder="مثال: Llama, Mistral"
              value={family}
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size">حجم</Label>
            <Input
              disabled={addModelMutation.isPending}
              id="size"
              onChange={(e) => setSize(e.target.value)}
              placeholder="مثال: 7B, 13B, 70B"
              value={size}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              disabled={addModelMutation.isPending}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              لغو
            </Button>
            <Button disabled={addModelMutation.isPending} type="submit">
              {addModelMutation.isPending
                ? "در حال اضافه کردن..."
                : "اضافه کردن مدل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
