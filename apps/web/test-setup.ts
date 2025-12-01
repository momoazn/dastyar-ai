// Test setup for React component tests with Bun
import { Window } from "happy-dom";

// Create a happy-dom window instance and assign it to global
const window = new Window();

// Type-safe assignments for happy-dom test environment
// These are necessary because happy-dom types don't perfectly match DOM types
type HappyDOMWindow = typeof window & {
  document: Document;
  HTMLElement: typeof HTMLElement;
  Element: typeof Element;
  Node: typeof Node;
  DocumentFragment: typeof DocumentFragment;
  navigator: Navigator;
};

const happyWindow = window as unknown as HappyDOMWindow;

global.window = happyWindow as unknown as typeof globalThis.window;
global.document = happyWindow.document;
global.navigator = happyWindow.navigator as unknown as Navigator;
global.HTMLElement = happyWindow.HTMLElement;
global.Element = happyWindow.Element;
global.Node = happyWindow.Node;
global.DocumentFragment = happyWindow.DocumentFragment;
