import { useQuery } from "@tanstack/react-query";
import {
  Code,
  FileText,
  Globe,
  Image,
  MessageCircle,
  MessageSquare,
  X,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";
import { orpc } from "@/utils/orpc";

type UserType = Omit<User, "password" | "salt">;

type UserDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
};

type ActivityStat = {
  icon: React.ReactNode;
  label: string;
  value: number;
};

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
}: UserDetailDialogProps) {
  const { data: userDetails, isLoading } = useQuery(
    orpc.admin.getUserDetails.queryOptions({
      input: { userId: user?.id ?? 0 },
      enabled: !!user,
    })
  );

  if (!user) {
    return null;
  }

  const activityStats: ActivityStat[] = userDetails
    ? [
        {
          icon: <MessageSquare className="h-4 w-4" />,
          label: "پیام‌ها",
          value: userDetails.messageCount,
        },
        {
          icon: <FileText className="h-4 w-4" />,
          label: "اسناد",
          value: userDetails.documentCount,
        },
        {
          icon: <Image className="h-4 w-4" />,
          label: "تصاویر",
          value: userDetails.imageCount,
        },
        {
          icon: <Globe className="h-4 w-4" />,
          label: "ترجمه‌ها",
          value: userDetails.translationCount,
        },
        {
          icon: <Zap className="h-4 w-4" />,
          label: "خلاصه‌ها",
          value: userDetails.summaryCount,
        },
        {
          icon: <Code className="h-4 w-4" />,
          label: "کدهای اجرا شده",
          value: userDetails.codeRunCount,
        },
        {
          icon: <MessageCircle className="h-4 w-4" />,
          label: "گفتگوها",
          value: userDetails.threadCount,
        },
      ]
    : [];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>جزئیات کاربر</DialogTitle>
          <Button
            className="h-6 w-6 p-0"
            onClick={() => onOpenChange(false)}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {(() => {
          if (isLoading) {
            return (
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
              </div>
            );
          }
          if (userDetails) {
            return (
              <div className="space-y-6">
                {/* User Info */}
                <Card className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        نام کاربری
                      </span>
                      <span className="font-medium">
                        {userDetails.username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        نقش
                      </span>
                      <Badge
                        variant={
                          userDetails.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {userDetails.role === "admin" ? "مدیر" : "کاربر"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        تاریخ ایجاد
                      </span>
                      <span className="text-sm">
                        {new Date(userDetails.createdAt).toLocaleDateString(
                          "fa-IR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        آخرین به‌روزرسانی
                      </span>
                      <span className="text-sm">
                        {new Date(userDetails.updatedAt).toLocaleDateString(
                          "fa-IR",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Activity Stats */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">فعالیت</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {activityStats.map((stat) => (
                      <Card className="p-3 text-center" key={stat.label}>
                        <div className="mb-2 flex justify-center text-muted-foreground">
                          {stat.icon}
                        </div>
                        <div className="font-bold text-2xl">{stat.value}</div>
                        <div className="mt-1 text-muted-foreground text-xs">
                          {stat.label}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </DialogContent>
    </Dialog>
  );
}
