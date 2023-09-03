export type Status = 'RUNNING' | 'STOPPED';

export interface State {
  status: Status;
  total: number;
  start: number;
  end: number;
  isStarted: boolean;
  isPaused: boolean;
}
