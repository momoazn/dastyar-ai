import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@/components/ui";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "رمز عبور فعلی الزامی است"),
    newPassword: z.string().min(6, fa.settings.account.passwordTooShort),
    confirmPassword: z.string().min(1, "تکرار رمز عبور الزامی است"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: fa.settings.account.passwordMismatch,
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SecuritySection() {
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updatePasswordMutation = useMutation(
    orpc.auth.updatePassword.mutationOptions({
      onSuccess: () => {
        toast.success(fa.settings.account.passwordUpdated);
        setIsPasswordDialogOpen(false);
        passwordForm.reset();
      },
      onError: (error: Error) => {
        toast.error(fa.settings.account.passwordUpdateError, {
          description: getErrorMessage(
            error,
            fa.settings.account.passwordUpdateError
          ),
        });
      },
    })
  );

  const onPasswordSubmit = (values: PasswordFormValues) => {
    updatePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <>
      <SettingsSection
        description={fa.settings.security.description}
        icon={<Shield className="h-4 w-4" />}
        title={fa.settings.security.title}
      >
        <div className="space-y-3">
          <SettingsItem
            description={fa.settings.security.passwordDescription}
            label={fa.settings.account.password}
          >
            <Button
              className="min-w-28"
              onClick={() => setIsPasswordDialogOpen(true)}
              size="sm"
              variant="outline"
            >
              {fa.settings.account.changePassword}
            </Button>
          </SettingsItem>
        </div>
      </SettingsSection>

      <Dialog
        onOpenChange={setIsPasswordDialogOpen}
        open={isPasswordDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">
              {fa.settings.account.changePassword}
            </DialogTitle>
            <DialogDescription className="text-right">
              برای تغییر رمز عبور، ابتدا رمز عبور فعلی خود را وارد کنید
            </DialogDescription>
          </DialogHeader>

          <Form {...passwordForm}>
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
            >
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">
                      {fa.settings.account.currentPassword}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="text-right"
                        dir="rtl"
                        disabled={updatePasswordMutation.isPending}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">
                      {fa.settings.account.newPassword}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="text-right"
                        dir="rtl"
                        disabled={updatePasswordMutation.isPending}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />

              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">
                      {fa.settings.account.confirmPassword}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="text-right"
                        dir="rtl"
                        disabled={updatePasswordMutation.isPending}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage className="text-right" />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  disabled={updatePasswordMutation.isPending}
                  onClick={() => setIsPasswordDialogOpen(false)}
                  type="button"
                  variant="outline"
                >
                  {fa.settings.cancel}
                </Button>
                <Button
                  disabled={updatePasswordMutation.isPending}
                  type="submit"
                >
                  {updatePasswordMutation.isPending
                    ? fa.general.loading
                    : fa.settings.account.updatePassword}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
