import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { tokenAtom } from "@/atoms/auth";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@/hooks/use-user";
import { getErrorMessage } from "@/lib/error-utils";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";

const usernameSchema = z.object({
  newUsername: z.string().regex(/^\d{10}$/, "کد ملی باید دقیقاً ۱۰ رقم باشد"),
});

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

type UsernameFormValues = z.infer<typeof usernameSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

export function AccountSettings() {
  const { data: user } = useUser();
  const setToken = useSetAtom(tokenAtom);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      newUsername: "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateUsernameMutation = useMutation(
    orpc.auth.updateUsername.mutationOptions({
      onSuccess: (data) => {
        toast.success(fa.settings.account.usernameUpdated);
        // Update token with new username
        setToken(data.token);
        usernameForm.reset();
      },
      onError: (error: Error) => {
        toast.error(fa.settings.account.usernameUpdateError, {
          description: getErrorMessage(
            error,
            fa.settings.account.usernameUpdateError
          ),
        });
      },
    })
  );

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

  const onUsernameSubmit = (values: UsernameFormValues) => {
    updateUsernameMutation.mutate({ newUsername: values.newUsername });
  };

  const onPasswordSubmit = (values: PasswordFormValues) => {
    updatePasswordMutation.mutate({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
  };

  return (
    <div className="space-y-6">
      {/* Username Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-right">
            <h3 className="font-semibold text-lg">
              {fa.settings.account.username}
            </h3>
            <p className="text-muted-foreground text-sm">
              {fa.settings.account.currentUsername}: {user?.username}
            </p>
          </div>
        </div>

        <Form {...usernameForm}>
          <form
            className="space-y-4"
            onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}
          >
            <FormField
              control={usernameForm.control}
              name="newUsername"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-right">
                    {fa.settings.account.newUsername}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="text-right"
                      dir="ltr"
                      disabled={updateUsernameMutation.isPending}
                      inputMode="numeric"
                      maxLength={10}
                      minLength={10}
                      pattern="\\d{10}"
                      placeholder={user?.username}
                    />
                  </FormControl>
                  <FormMessage className="text-right" />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button disabled={updateUsernameMutation.isPending} type="submit">
                {updateUsernameMutation.isPending
                  ? fa.general.loading
                  : fa.settings.account.updateUsername}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Divider */}
      <div className="my-6 border-t" />

      {/* Password Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button onClick={() => setIsPasswordDialogOpen(true)}>
            {fa.settings.account.changePassword}
          </Button>
          <div className="flex-1 text-right">
            <h3 className="font-semibold text-lg">
              {fa.settings.account.password}
            </h3>
            <p className="text-muted-foreground text-sm">
              تغییر رمز عبور حساب کاربری
            </p>
          </div>
        </div>
      </div>

      {/* Password Change Dialog */}
      <Dialog
        onOpenChange={setIsPasswordDialogOpen}
        open={isPasswordDialogOpen}
      >
        <DialogContent>
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
                  {fa.chat.cancel}
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
    </div>
  );
}
