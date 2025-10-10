import { useQuery } from '@tanstack/react-query';
import { createFileRoute, useParams } from '@tanstack/react-router';
import { Calendar, ImagePlus } from 'lucide-react';
import { Alert, AlertDescription, Card } from '@/components/ui';
// import type { GeneratedImage } from '@/hooks/use-image-generation';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/image/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: '/image/$id' });
  const numericId = Number(id);

  const {
    data: image,
    isLoading: isLoadingImage,
    error,
  } = useQuery(
    orpc.images.get.queryOptions({
      input: { id: numericId },
      enabled: !Number.isNaN(numericId) && numericId > 0,
    })
  );

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) {
      return fa.general.unknown;
    }
    return new Date(dateStr).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <main className="container mx-auto h-full max-w-7xl p-4">
      <div className="flex h-full gap-6">
        {/* Image Preview Section */}
        <div className="flex flex-1 flex-col">
          {(() => {
            // Check for invalid ID
            if (Number.isNaN(numericId) || numericId <= 0) {
              return (
                <div className="flex flex-1 items-center justify-center">
                  <Alert>
                    <AlertDescription>
                      {fa.imageGeneration.invalidImageId}
                    </AlertDescription>
                  </Alert>
                </div>
              );
            }

            // Check for error
            if (error) {
              return (
                <div className="flex flex-1 items-center justify-center">
                  <Alert>
                    <AlertDescription>
                      {fa.imageGeneration.loadingImageError} {error.message}
                    </AlertDescription>
                  </Alert>
                </div>
              );
            }

            if (image) {
              return (
                <>
                  {/* Simplified header removed */}

                  {/* Main Image */}
                  <div className="mb-4 flex flex-1 items-center justify-center rounded-lg bg-muted/30 p-4">
                    <img
                      alt={image.prompt}
                      className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
                      src={image.imageUrl}
                    />
                  </div>
                </>
              );
            }
            if (isLoadingImage) {
              return (
                <div className="flex flex-1 items-center justify-center">
                  <Card className="w-[320px] p-6">
                    <div className="space-y-4 text-center">
                      <ImagePlus className="mx-auto h-12 w-12 animate-pulse text-primary" />
                      <div>
                        <h3 className="font-semibold">
                          {fa.imageGeneration.generatingAlt}
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          {fa.imageGeneration.generatingDescription}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              );
            }
            return (
              <div className="flex flex-1 items-center justify-center">
                <Alert>
                  <AlertDescription>
                    {fa.imageGeneration.imageNotFound}
                  </AlertDescription>
                </Alert>
              </div>
            );
          })()}
        </div>

        {/* Metadata Panel */}
        {image && (
          <Card className="w-80 p-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">
                {fa.imageGeneration.imageDetails}
              </h3>

              {/* Prompt */}
              <div>
                <h4 className="mb-2 font-medium">
                  {fa.imageGeneration.generationCommand}
                </h4>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm leading-relaxed">{image.prompt}</p>
                </div>
              </div>

              {/* Negative Prompt */}
              {image.negativePrompt && (
                <div>
                  <h4 className="mb-2 font-medium">
                    {fa.imageGeneration.negativeCommand}
                  </h4>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm leading-relaxed">
                      {image.negativePrompt}
                    </p>
                  </div>
                </div>
              )}

              {/* Creation Date */}
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Calendar className="h-4 w-4" />
                <span>
                  {formatDate((image.createdAt as unknown as string) ?? null)}
                </span>
              </div>

              {/* Settings */}
              {image.settings && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {fa.imageGeneration.stepsLabel}
                    </span>
                    <span>{image.settings?.steps || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CFG Scale:</span>
                    <span>{image.settings?.cfg_scale || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {fa.imageGeneration.samplerLabel}
                    </span>
                    <span>{image.settings?.sampler_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {fa.imageGeneration.sizeLabel}
                    </span>
                    <span>
                      {image.settings?.width || 'N/A'}×
                      {image.settings?.height || 'N/A'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}
