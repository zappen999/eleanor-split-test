export = Experiment;

type Settings = {
  name: string;
  persist?: {
    read: (key: string) => Promise<string>;
    write: (key: string, outcomeId: string) => Promise<void>;
  };
  outcomes: Array<[string, number]>;
  userId?: string;
  report: (experimentName: string, outcomeId: string, userId?: string) => void;
};

declare class Experiment {
  constructor(settings: Settings)

  evaluate: () => Promise<string>;
}
