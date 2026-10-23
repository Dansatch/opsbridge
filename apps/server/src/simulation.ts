import {
  SIMULATION_TICK_MS,
  advanceSimulation,
  createInitialSimulation,
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
    this.state = advanceSimulation(this.state);
    this.listeners.forEach((listener) => listener(this.state));
    return this.state;
  }

  subscribe(listener: SimulationListener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
