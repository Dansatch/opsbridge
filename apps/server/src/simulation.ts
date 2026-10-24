import {
  SIMULATION_TICK_MS,
  acknowledgeIncident,
  advanceSimulation,
  changeShift,
  createInitialSimulation,
  recoverIncident,
  triggerFailure,
  type FailureScenarioId,
  type Shift,
  type SimulationState,
} from '@opsbridge/domain';

type SimulationListener = (state: SimulationState) => void;

export class SimulationEngine {
  private state = createInitialSimulation();
  private readonly listeners = new Set<SimulationListener>();
  private timer?: NodeJS.Timeout;

  constructor(private readonly tickMs = SIMULATION_TICK_MS) {}

  getState() {
    return this.state;
  }

  advance() {
    return this.update(advanceSimulation);
  }

  triggerFailure(failureId: FailureScenarioId) {
    return this.update((state) => triggerFailure(state, failureId));
  }

  changeShift(shift: Shift) {
    return this.update((state) => changeShift(state, shift));
  }

  acknowledgeIncident(incidentId: string) {
    return this.update((state) => acknowledgeIncident(state, incidentId));
  }

  recoverIncident(incidentId: string) {
    return this.update((state) => recoverIncident(state, incidentId));
  }

  subscribe(listener: SimulationListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private update(updateState: (state: SimulationState) => SimulationState) {
    const nextState = updateState(this.state);
    if (nextState === this.state) return this.state;
    this.state = nextState;
    this.listeners.forEach((listener) => listener(this.state));
    return this.state;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => this.advance(), this.tickMs);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
