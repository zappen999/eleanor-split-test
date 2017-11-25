'use strict';
const Experiment = require('./index');

const fakeDb = {};

function read(key) {
  return Promise.resolve(fakeDb[key]);
}

function write(key, outcome) {
  fakeDb[key] = outcome;
  return Promise.resolve();
}

// setup the experiment
const experiment = new Experiment({
  // Name of this test, to be able to distinguish between tests when running
  // multiple at the same time.
  name: 'green-vs-red-btn',
  // Configure the different outcomes that you want to test, along with a
  // weight that tells how likely the outcome is.
  outcomes: [
    ['green', 0.5],
    ['red', 0.5],
  ],
  // Supply a function that will be triggered when evaluating an experiment.
  report: (experimentName, outcomeName, userId) => {
    console.log('Send to your favorite analytics service');
  },
  // (Optional) Persisting functions, when you want the first outcome be become
  // sticky for this particular user.
  persist: {
    read,
    write,
  },
  // (Optional) Used in multi-user contexts, such as backend applications to
  // distinguish between users when persisting the outcome.
  userId: 3,
});

// evaluate the actual experiment
experiment.evaluate().then(outcomeName => {
  console.log('Lets go with the', outcomeName, 'button');
});
