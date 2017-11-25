export namespace EleanorSplitTest {
  export type Settings = {
    name: string;
    persist?: {
      read: (key: string) => Promise<string>;
      write: (key: string, outcomeId: string) => Promise<void>;
    };
    outcomes: Array<[string, number]>;
    userId?: string;
    report: (experimentName: string, outcomeId: string, userId?: string) => void;
  };

  export default class Experiment {
    private defaults : Settings = {
      userId: '',
      name: null,
      persist: null,
      outcomes: [],
      report: () => {},
    };

    userId: string;
    name: string;

    private shouldPersist: boolean;
    private read: (key: string) => Promise<string>;
    private write: (key: string, outcomeId: string) => Promise<void>;
    private outcomes: Array<Array<any>>;
    private report: (
      experimentName: string,
      outcomeId: string,
      userId?: string
    ) => void;

    constructor(settings: Settings) {
      this.userId = settings.userId || this.defaults.userId;
      this.name = settings.name || this.defaults.name;

      this.shouldPersist = settings.persist
        && typeof settings.persist.write === 'function'
        && typeof settings.persist.read === 'function';

      if (this.shouldPersist) {
        this.read = settings.persist.read;
        this.write = settings.persist.write;
      }

      this.outcomes = settings.outcomes || this.defaults.outcomes;
      this.report = settings.report || this.defaults.report;

      this.evaluate = this.evaluate.bind(this);
      this.readPreviousEvaluation = this.readPreviousEvaluation.bind(this);
      this.getWeightedRandom = this.getWeightedRandom.bind(this);
      this.writeEvaluation = this.writeEvaluation.bind(this);
    }

    evaluate(): Promise<string> {
      return this.readPreviousEvaluation()
        .then(outcomeId => {
          if (outcomeId) {
            return Promise.resolve({
              outcomeId,
              existed: true,
            });
          }

          return Promise.resolve({
            outcomeId: this.getWeightedRandom(),
            existed: false,
          });
        })
        .then(result => {
          if (!result.existed) {
            return this.writeEvaluation(result.outcomeId)
              .then(() => result.outcomeId);
          }

          return Promise.resolve(result.outcomeId);
        })
        .then(outcomeId => {
          this.report(this.name, outcomeId, this.userId);
          return outcomeId;
        });
    }

    private readPreviousEvaluation(): Promise<string> {
      if (!this.shouldPersist) {
        return Promise.resolve(null);
      }

      return this.read(`${this.name}${this.userId}`);
    }

    writeEvaluation(outcome): Promise<void> {
      if (!this.shouldPersist) {
        return Promise.resolve(null);
      }

      return this.write(`${this.name}${this.userId}`, outcome);
    }

    getWeightedRandom(): string {
      const total = this.outcomes.reduce((sum, outcome) => (sum + outcome[1]), 0);
      const needle = Math.random() * total;

      let sum = 0;
      const outcome = this.outcomes.find(outcome => {
        sum = sum + outcome[1];
        return needle >= sum - outcome[1] && needle <= sum;
      });

      return outcome[0];
    }
  }
}
