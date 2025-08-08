import {
  CollapsibleContent as RadixCollapsibleContent,
  Root as RadixCollapsibleRoot,
  CollapsibleTrigger as RadixCollapsibleTrigger,
} from '@radix-ui/react-collapsible';

function Collapsible({
  ...props
}: React.ComponentProps<typeof RadixCollapsibleRoot>) {
  return <RadixCollapsibleRoot data-slot="collapsible" {...props} />;
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof RadixCollapsibleTrigger>) {
  return <RadixCollapsibleTrigger data-slot="collapsible-trigger" {...props} />;
}

function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof RadixCollapsibleContent>) {
  return <RadixCollapsibleContent data-slot="collapsible-content" {...props} />;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
