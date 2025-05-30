import { ImagePlus } from "lucide-react";

import { Card } from "@/components/ui";

export default function ImagePage() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-4 p-4">
      <Card className="p-8 text-center max-w-md">
        <ImagePlus className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-2xl font-bold mb-2">تولید تصویر</h2>
        <p className="text-muted-foreground">
          این قابلیت در حال حاضر در دسترس نیست و در نسخه‌های آینده اضافه خواهد شد.
        </p>
      </Card>
    </main>
  );
}
