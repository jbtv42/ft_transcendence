class Timer {
    constructor(counter = 3) {
        this.counter = counter;
        let intervalId = setInterval(() => {
            this.counter = this.counter - 1;
            console.log(this.counter);
            if (this.counter === 0)
                clearInterval(intervalId);
        }, 1000);
    }
}
export {};
