import { ImagePlus } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";

import { Card } from "@/components/ui";

export const Route = createFileRoute("/image")({
  component: ImageRouteComponent,
});

function ImageRouteComponent() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <Card className="max-w-md p-8 text-center">
        <ImagePlus className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
        <h2 className="mb-2 text-2xl font-bold">تولید تصویر</h2>
        <p className="text-muted-foreground">
          این قابلیت در حال حاضر در دسترس نیست و در نسخه‌های آینده اضافه خواهد
          شد.
        </p>
      </Card>
    </main>
  );
}
