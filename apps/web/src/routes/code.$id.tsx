import { useQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft, Code, Shield } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { fa } from '@/lib/persian-texts';
import { orpc } from '@/utils/orpc';

export const Route = createFileRoute('/code/$id')({
  component: CodeSessionPage,
});

function CodeSessionPage() {
  const { id } = Route.useParams();
  const sessionId = Number.parseInt(id, 10);

  const { data: session, isLoading } = useQuery(
    orpc.code.getSession.queryOptions({
      input: { id: sessionId },
    })
  );

  const { data: generations } = useQuery(
    orpc.code.getGenerations.queryOptions({
      input: { sessionId },
    })
  );

  const { data: reviews } = useQuery(
    orpc.code.getReviews.queryOptions({
      input: { sessionId },
    })
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center" dir="rtl">
        <div className="text-muted-foreground">
          {fa.codeAssistant.messages.loading}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full items-center justify-center" dir="rtl">
        <div className="text-center">
          <h2 className="font-semibold text-xl">
            {fa.codeAssistant.messages.sessionNotFound}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {fa.codeAssistant.messages.sessionNotFoundDescription}
          </p>
          <Link to="/code">
            <Button className="mt-4">
              <ArrowLeft className="ml-2 h-4 w-4" />
              {fa.codeAssistant.messages.backToCodeAssistant}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-full flex-col" dir="rtl">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/code">
              <Button size="sm" variant="ghost">
                <ArrowLeft className="ml-2 h-4 w-4" />
                {fa.codeAssistant.messages.back}
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-xl">{session.title}</h1>
              <p className="text-muted-foreground text-sm">
                {fa.codeAssistant.session.language}: {session.language} •{' '}
                {fa.codeAssistant.session.createdAt}:{' '}
                {formatDate(session.createdAt)}
              </p>
            </div>
          </div>
          <Link to="/code">
            <Button variant="outline">
              <Code className="ml-2 h-4 w-4" />
              {fa.codeAssistant.messages.newSession}
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 overflow-auto p-4">
        {/* Generations */}
        {generations && generations.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg">
              <Code className="h-5 w-5" />
              تولیدات کد ({generations.length})
            </h2>
            <div className="space-y-3">
              {generations.map((generation) => (
                <Card className="p-4" key={generation.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-muted-foreground text-sm">
                      {formatDate(generation.createdAt)}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {fa.codeAssistant.session.model}: {generation.modelUsed}
                    </div>
                  </div>
                  <div className="mb-3">
                    <h4 className="mb-2 font-medium">
                      {fa.codeAssistant.session.request}:
                    </h4>
                    <div className="rounded bg-muted p-3 font-mono text-sm">
                      {generation.prompt}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">
                      {fa.codeAssistant.session.generatedCode}:
                    </h4>
                    <div className="whitespace-pre-wrap rounded bg-muted p-3 font-mono text-sm">
                      {generation.generatedCode}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {reviews && reviews.length > 0 && (
          <div>
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-lg">
              <Shield className="h-5 w-5" />
              {fa.codeAssistant.session.reviews} ({reviews.length})
            </h2>
            <div className="space-y-3">
              {reviews.map((review) => {
                const suggestions = JSON.parse(
                  review.suggestions || '[]'
                ) as Array<{
                  severity: string;
                  type: string;
                  message: string;
                  line?: number;
                  fix?: string;
                }>;

                return (
                  <Card className="p-4" key={review.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-muted-foreground text-sm">
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="mb-2 font-medium">
                        {fa.codeAssistant.session.reviewedCode}:
                      </h4>
                      <div className="whitespace-pre-wrap rounded bg-muted p-3 font-mono text-sm">
                        {review.codeInput}
                      </div>
                    </div>
                    <div className="mb-3">
                      <h4 className="mb-2 font-medium">
                        {fa.codeAssistant.session.reviewResult}:
                      </h4>
                      <div className="rounded bg-muted p-3 text-sm">
                        {review.reviewFeedback}
                      </div>
                    </div>
                    {suggestions.length > 0 && (
                      <div>
                        <h4 className="mb-2 font-medium">
                          {fa.codeAssistant.session.suggestions}:
                        </h4>
                        <div className="space-y-2">
                          {suggestions.map((suggestion, index) => {
                            const getSeverityClass = (severity: string) => {
                              switch (severity) {
                                case 'critical':
                                  return 'bg-red-100 text-red-800';
                                case 'high':
                                  return 'bg-orange-100 text-orange-800';
                                case 'medium':
                                  return 'bg-yellow-100 text-yellow-800';
                                case 'low':
                                  return 'bg-blue-100 text-blue-800';
                                default:
                                  return 'bg-gray-100 text-gray-800';
                              }
                            };

                            return (
                              <div
                                className="rounded bg-muted p-3 text-sm"
                                key={`${review.id}-${index}`}
                              >
                                <div className="mb-1 flex items-center gap-2">
                                  <span
                                    className={`rounded px-2 py-1 text-xs ${getSeverityClass(suggestion.severity)}`}
                                  >
                                    {suggestion.severity}
                                  </span>
                                  <span className="text-muted-foreground text-xs">
                                    {suggestion.type}
                                  </span>
                                  {suggestion.line && (
                                    <span className="text-muted-foreground text-xs">
                                      {fa.codeAssistant.session.line}{' '}
                                      {suggestion.line}
                                    </span>
                                  )}
                                </div>
                                <div>{suggestion.message}</div>
                                {suggestion.fix && (
                                  <div className="mt-2 rounded bg-background p-2 font-mono text-xs">
                                    {suggestion.fix}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!generations || generations.length === 0) &&
          (!reviews || reviews.length === 0) && (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Code className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 font-semibold text-lg">
                  {fa.codeAssistant.messages.noActivity}
                </h3>
                <p className="mb-4 text-muted-foreground">
                  {fa.codeAssistant.messages.noActivityDescription}
                </p>
                <Link to="/code">
                  <Button>
                    <Code className="ml-2 h-4 w-4" />
                    {fa.codeAssistant.messages.startWorking}
                  </Button>
                </Link>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
