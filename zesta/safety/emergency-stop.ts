let stopped = false;

export function isStopped() { return stopped; }
export function triggerStop() { stopped = true; }
export function reset()      { stopped = false; }
