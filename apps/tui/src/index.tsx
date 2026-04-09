#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './App.js';
import { EngineClient } from './lib/engine.js';

const engine = new EngineClient();

process.on('exit', () => engine.kill());
process.on('SIGINT', () => {
  engine.kill();
  process.exit(0);
});

render(<App engine={engine} />);
