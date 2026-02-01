import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
  Input,
} from "@/components/ui";
import { useUser } from "@/hooks/use-user";
import { fa } from "@/lib/texts";
import { orpc } from "@/utils/orpc";
import { SettingsItem } from "./settings-item";
import { SettingsSection } from "./settings-section";

const usernameSchema = z.object({
  newUsername: z.string().min(3).max(50),
});

type UsernameFormValues = z.infer<typeof usernameSchema>;

export function ProfileSection() {
  const { data: user } = useUser();
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  const usernameForm = useForm<UsernameFormValues>({
    resolver: zodResolver(usernameSchema),
    defaultValues: {
      newUsername: user?.username || "",
    },
  });

  const updateUsernameMutation = useMutation(
    orpc.auth.updateUsername.mutationOptions({
      onSuccess: () => {
        toast.success(fa.settings.account.usernameUpdated);
        setIsEditingUsername(false);
        usernameForm.reset();
      },
      onError: (error: Error) => {
        toast.error(fa.settings.account.usernameUpdateError, {
          description: error.message,
        });
      },
    })
  );

  const onUsernameSubmit = (values: UsernameFormValues) => {
    updateUsernameMutation.mutate({ newUsername: values.newUsername });
  };

  return (
    <SettingsSection
      description={fa.settings.profile.description}
      icon={<User className="h-4 w-4" />}
      title={fa.settings.profile.title}
    >
      <div className="space-y-4">
        <SettingsItem
          description={fa.settings.account.currentUsername}
          label={fa.settings.account.username}
        >
          {isEditingUsername ? (
            <Form {...usernameForm}>
              <form
                className="flex items-center gap-3"
                onSubmit={usernameForm.handleSubmit(onUsernameSubmit)}
              >
                <FormField
                  control={usernameForm.control}
                  name="newUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          className="w-48 text-right"
                          dir="rtl"
                          disabled={updateUsernameMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage className="text-right" />
                    </FormItem>
                  )}
                />
                <Button
                  disabled={updateUsernameMutation.isPending}
                  size="sm"
                  type="submit"
                >
                  {updateUsernameMutation.isPending
                    ? fa.general.loading
                    : fa.general.save}
                </Button>
                <Button
                  disabled={updateUsernameMutation.isPending}
                  onClick={() => {
                    setIsEditingUsername(false);
                    usernameForm.reset();
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {fa.general.cancel}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm">{user?.username}</span>
              <Button
                onClick={() => setIsEditingUsername(true)}
                size="sm"
                type="button"
                variant="outline"
              >
                {fa.general.edit}
              </Button>
            </div>
          )}
        </SettingsItem>
      </div>
    </SettingsSection>
  );
}
