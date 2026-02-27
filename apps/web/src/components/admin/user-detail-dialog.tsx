import { useQuery } from "@tanstack/react-query";
import {
  Code,
  FileText,
  Globe,
  Image,
  MessageCircle,
  MessageSquare,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fa } from "@/lib/texts";
import type { User } from "@/types/database";
import { orpc } from "@/utils/orpc";

type UserDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
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
          label: fa.admin.userDetails.stats.messages,
          value: userDetails.messageCount,
        },
        {
          icon: <FileText className="h-4 w-4" />,
          label: fa.admin.userDetails.stats.documents,
          value: userDetails.documentCount,
        },
        {
          icon: <Image className="h-4 w-4" />,
          label: fa.admin.userDetails.stats.images,
          value: userDetails.imageCount,
        },
        {
          icon: <Globe className="h-4 w-4" />,
          label: fa.admin.userDetails.stats.translations,
          value: userDetails.translationCount,
        },
        {
          icon: <Zap className="h-4 w-4" />,
          label: fa.admin.userDetails.stats.summaries,
          value: userDetails.summaryCount,
        },
        {
          icon: <Code className="h-4 w-4" />,
          label: fa.admin.userDetails.stats.codeRuns,
          value: userDetails.codeRunCount,
        },
        {
          icon: <MessageCircle className="h-4 w-4" />,
          label: fa.admin.userDetails.stats.threads,
          value: userDetails.threadCount,
        },
      ]
    : [];

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>{fa.admin.userDetails.title}</DialogTitle>
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
                        {fa.admin.userDetails.fields.username}
                      </span>
                      <span className="font-medium">
                        {userDetails.username}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        {fa.admin.userDetails.fields.role}
                      </span>
                      <Badge
                        variant={
                          userDetails.role === "admin" ? "default" : "secondary"
                        }
                      >
                        {userDetails.role === "admin"
                          ? fa.admin.users.table.admin
                          : fa.admin.users.table.user}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-muted-foreground text-sm">
                        {fa.admin.userDetails.fields.createdAt}
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
                        {fa.admin.userDetails.fields.updatedAt}
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
                  <h3 className="font-semibold text-sm">
                    {fa.admin.userDetails.activity}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
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
