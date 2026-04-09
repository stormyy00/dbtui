import React from 'react';
import { MainScreen } from './screens/MainScreen.js';
import { useEngine } from './hooks/useEngine.js';
import type { EngineClient } from './lib/engine.js';

// Path to scan: first CLI arg, or current working directory.
const SCAN_PATH = process.argv[2] ?? process.cwd();

export function App({ engine }: { engine: EngineClient }) {
  const engineState = useEngine(engine);
  return <MainScreen engineState={engineState} scanPath={SCAN_PATH} />;
}
