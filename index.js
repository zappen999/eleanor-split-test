'use strict';

const defaults = {
  userId: '',
  name: null,
  persist: null,
  outcomes: [],
  report: () => {},
};

class Experiment {
  constructor(settings) {
    this.userId = settings.userId || defaults.userId;
    this.name = settings.name || defaults.name;

    this._shouldPersist = settings.persist
      && typeof settings.persist.write === 'function'
      && typeof settings.persist.read === 'function';

    if (this._shouldPersist) {
      this._read = settings.persist.read;
      this._write = settings.persist.write;
    }

    this._outcomes = settings.outcomes || defaults.outcomes;
    this._report = settings.report || defaults.report;

    this.evaluate = this.evaluate.bind(this);
    this._readPreviousEvaluation = this._readPreviousEvaluation.bind(this);
    this._getWeightedRandom = this._getWeightedRandom.bind(this);
    this._writeEvaluation = this._writeEvaluation.bind(this);
  }

  evaluate() {
    return this._readPreviousEvaluation()
      .then(outcomeId => {
        if (outcomeId) {
          return Promise.resolve({
            outcomeId,
            existed: true,
          });
        }

        return Promise.resolve({
          outcomeId: this._getWeightedRandom(),
          existed: false,
        });
      })
      .then(result => {
        if (!result.existed) {
          return this._writeEvaluation(result.outcomeId)
            .then(() => result.outcomeId);
        }

        return Promise.resolve(result.outcomeId);
      })
      .then(outcomeId => {
        this._report(this.name, outcomeId, this.userId);
        return outcomeId;
      });
  }

  _readPreviousEvaluation() {
    if (!this._shouldPersist) {
      return Promise.resolve(null);
    }

    return this._read(`${this.name}${this.userId}`);
  }

  _writeEvaluation(outcome) {
    if (!this._shouldPersist) {
      return Promise.resolve(null);
    }

    return this._write(`${this.name}${this.userId}`, outcome);
  }

  _getWeightedRandom() {
    const total = this._outcomes.reduce((sum, outcome) => (sum + outcome[1]), 0);
    const needle = Math.random() * total;

    let sum = 0;
    const outcome = this._outcomes.find(outcome => {
      sum = sum + outcome[1];
      return needle >= sum - outcome[1] && needle <= sum;
    });

    return outcome[0];
  }
}

module.exports = Experiment;
