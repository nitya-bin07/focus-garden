export class FocusTimer {
  constructor(durationInMinutes, onTick, onComplete) {
    this.totalSeconds = durationInMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.intervalId = null;

    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.remainingSeconds--;

      this.onTick(this.remainingSeconds);

      if (this.remainingSeconds <= 0) {
        this.stop();
        this.onComplete();
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  reset() {
    this.stop();
    this.remainingSeconds = this.totalSeconds;
  }
}
