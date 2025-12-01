// Test setup for React component tests with Bun
import { Window } from "happy-dom";

// Create a happy-dom window instance and assign it to global
const window = new Window();
// biome-ignore lint/suspicious/noExplicitAny: Test setup requires type casting for happy-dom compatibility
global.window = window as any;
global.document = window.document as unknown as Document;
global.navigator = window.navigator as unknown as Navigator;
global.HTMLElement = window.HTMLElement as unknown as typeof HTMLElement;
global.Element = window.Element as unknown as typeof Element;
global.Node = window.Node as unknown as typeof Node;
global.DocumentFragment =
  window.DocumentFragment as unknown as typeof DocumentFragment;
