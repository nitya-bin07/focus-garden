// export class FocusTimer {
//   constructor(durationInMinutes, onTick, onComplete) {
//     this.totalSeconds = durationInMinutes * 60;
//     this.remainingSeconds = this.totalSeconds;
//     this.intervalId = null;

//     this.onTick = onTick;
//     this.onComplete = onComplete;
//   }

//   start() {
//     if (this.intervalId) return;

//     this.intervalId = setInterval(() => {
//       this.remainingSeconds--;

//       this.onTick(this.remainingSeconds);

//       if (this.remainingSeconds <= 0) {
//         this.stop();
//         this.onComplete();
//       }
//     }, 1000);
//   }

//   stop() {
//     clearInterval(this.intervalId);
//     this.intervalId = null;
//   }

//   reset() {
//     this.stop();
//     this.remainingSeconds = this.totalSeconds;
//   }
// }
export class FocusTimer {
  constructor(durationInMinutes, onTick, onComplete) {
    this.totalSeconds = durationInMinutes * 60;
    this.remainingSeconds = this.totalSeconds;
    this.intervalId = null;
    this.startTime = null;
    this.onTick = onTick;
    this.onComplete = onComplete;
  }

  start() {
    if (this.intervalId) return;
    this.startTime = Date.now();

    this.intervalId = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      this.remainingSeconds = this.totalSeconds - elapsed;

      if (this.remainingSeconds <= 0) {
        this.remainingSeconds = 0;
        this.onTick(this.remainingSeconds);
        this.stop();
        this.onComplete();
        return;
      }

      this.onTick(this.remainingSeconds);
    }, 500);
  }

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  reset() {
    this.stop();
    this.remainingSeconds = this.totalSeconds;
    this.startTime = null;
  }
}
