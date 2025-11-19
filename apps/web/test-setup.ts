// Test setup for React component tests with Bun
import { Window } from "happy-dom";

// Create a happy-dom window instance and assign it to global
const window = new Window();
global.window = window as unknown as Window & typeof globalThis;
global.document = window.document;
global.navigator = window.navigator as Navigator;
global.HTMLElement = window.HTMLElement as typeof HTMLElement;
global.Element = window.Element as typeof Element;
global.Node = window.Node as typeof Node;
global.DocumentFragment = window.DocumentFragment as typeof DocumentFragment;
