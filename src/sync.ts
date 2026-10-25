import type { ViewState } from './chart/ChartEngine';

type CrossFn = (t: number | null) => void;
type ViewFn = (v: ViewState) => void;

/** Shares crosshair time and scroll position between charts while "sync" is on. */
export class SyncBus {
  private cross = new Map<string, CrossFn>();
  private view = new Map<string, ViewFn>();

  join(id: string, onCross: CrossFn, onView: ViewFn) {
    this.cross.set(id, onCross);
    this.view.set(id, onView);
    return () => { this.cross.delete(id); this.view.delete(id); };
  }

  crosshair(from: string, t: number | null) {
    this.cross.forEach((fn, id) => id !== from && fn(t));
  }

  scroll(from: string, v: ViewState) {
    this.view.forEach((fn, id) => id !== from && fn(v));
  }
}
