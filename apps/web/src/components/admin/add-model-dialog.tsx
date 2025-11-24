import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { orpc } from "@/utils/orpc";

interface AddModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error("خطا در اضافه کردن مدل");
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>افزودن مدل جدید</DialogTitle>
          <DialogDescription>
            مدل جدید را برای استفاده در سیستم ثبت کنید
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identifier */}
          <div className="space-y-2">
            <Label htmlFor="identifier">نام مدل *</Label>
            <Input
              id="identifier"
              placeholder="مثال: llama2, mistral-7b"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={addModelMutation.isPending}
            />
          </div>

          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">ارائه‌دهنده *</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value as LLMModelProvider)}
              disabled={addModelMutation.isPending}
            >
              <SelectTrigger id="provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ollama">Ollama</SelectItem>
                <SelectItem value="lmstudio">LM Studio</SelectItem>
                <SelectItem value="stable-diffusion">Stable Diffusion</SelectItem>
                <SelectItem value="whisper">Whisper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Creator */}
          <div className="space-y-2">
            <Label htmlFor="creator">سازنده</Label>
            <Input
              id="creator"
              placeholder="مثال: Meta, Mistral"
              value={creator}
              onChange={(e) => setCreator(e.target.value)}
              disabled={addModelMutation.isPending}
            />
          </div>

          {/* Family */}
          <div className="space-y-2">
            <Label htmlFor="family">خانواده</Label>
            <Input
              id="family"
              placeholder="مثال: Llama, Mistral"
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              disabled={addModelMutation.isPending}
            />
          </div>

          {/* Size */}
          <div className="space-y-2">
            <Label htmlFor="size">حجم</Label>
            <Input
              id="size"
              placeholder="مثال: 7B, 13B, 70B"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              disabled={addModelMutation.isPending}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={addModelMutation.isPending}
            >
              لغو
            </Button>
            <Button
              type="submit"
              disabled={addModelMutation.isPending}
            >
              {addModelMutation.isPending ? "در حال اضافه کردن..." : "اضافه کردن مدل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
