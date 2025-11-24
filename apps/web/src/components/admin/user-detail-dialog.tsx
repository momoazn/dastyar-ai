import { useQuery } from "@tanstack/react-query";
import { MessageSquare, FileText, Image, Globe, Zap, Code, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { UserWithoutSensitiveData as User } from "@/server/repositories/admin";
import { orpc } from "@/utils/orpc";

type UserType = Omit<User, "password" | "salt">;

interface UserDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType | null;
}

interface ActivityStat {
  icon: React.ReactNode;
  label: string;
  value: number;
}

export function UserDetailDialog({
  open,
  onOpenChange,
  user,
}: UserDetailDialogProps) {
  const { data: userDetails, isLoading } = useQuery(
    user
      ? orpc.admin.getUserDetails.queryOptions({ userId: user.id })
      : { queryKey: ["disabled"], enabled: false }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>جزئیات کاربر</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
          </div>
        ) : userDetails ? (
          <div className="space-y-6">
            {/* User Info */}
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    نام کاربری
                  </span>
                  <span className="font-medium">{userDetails.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
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
                  <span className="text-sm font-medium text-muted-foreground">
                    تاریخ ایجاد
                  </span>
                  <span className="text-sm">
                    {new Date(userDetails.createdAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    آخرین به‌روزرسانی
                  </span>
                  <span className="text-sm">
                    {new Date(userDetails.updatedAt).toLocaleDateString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Activity Stats */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">فعالیت</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {activityStats.map((stat) => (
                  <Card key={stat.label} className="p-3 text-center">
                    <div className="flex justify-center mb-2 text-muted-foreground">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
