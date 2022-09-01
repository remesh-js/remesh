export enum Steps {
  A = 'A',
  B = 'B',
  C = 'C',
}

export type stepsAction = { type: Steps.A } | { type: Steps.B } | { type: Steps.C }

export type StepsState = {
  currentStep: Steps
}

export type StepsReducer = React.Reducer<StepsState, stepsAction>
