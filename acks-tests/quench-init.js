import { exampleUnitTests } from './example-unit-tests.js';

Hooks.once('quenchReady', (quench) => {
  quench.registerBatch('acks.examples', exampleUnitTests, { displayName: 'Example Unit Tests' });
});
