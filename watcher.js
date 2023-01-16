class Watcher {
	constructor(clsIds, stdIds, clsDuration, dBC, totalExams) {
		this.clsIds = clsIds;
		this.stdIds = stdIds;
		this.clsDuration = clsDuration + dBC;
		this.startTime = new Date();
		this.breakIn = totalExams / 2;
		this.breakStart = this.breakIn * (clsDuration + dBC);
		this.breakEnd = this.breakIn * (clsDuration + dBC) + clsDuration;
	}
	async getId(id) {
		//find student index / sequence
		let index = this.stdIds.indexOf(id);

		// calculate elapsed time since class / exam started
		var endTime = new Date();
		var timeDiff = (endTime - this.startTime) / 1000;
		let elapsedTime = timeDiff / 60;

		// create temp array of classes for current std
		let ids = [...this.clsIds];
		let firstHalf = ids.splice(index);
		let tempClsIds = [...firstHalf, ...ids];

		if (elapsedTime < this.breakStart || elapsedTime == this.breakStart) {
			// find class index
			let clsIndex = Math.floor(elapsedTime / this.clsDuration);

			// calculate total time for current number of classes
			let totalTime = (clsIndex + 1) * this.clsDuration;
			console.log("--------------------------");
			console.log("totalTime (", clsIndex + 1, ") :", totalTime);
			console.log("elapsedTime : ", elapsedTime.toFixed(2));
			console.log("--------------------------");

			// if id found send that or
			// (id not found mean class total time exceded) send cls end
			if (tempClsIds[clsIndex]) {
				return {
					canJoin: true,
					id: tempClsIds[clsIndex],
					timeLeft: totalTime - elapsedTime.toFixed(2),
				};
			} else {
				return {
					canJoin: false,
				};
			}
		} else if (
			elapsedTime > this.breakEnd ||
			elapsedTime == this.breakEnd
		) {
			// find class index
			let clsIndex = Math.floor(
				(elapsedTime - (this.clsDuration - 0.5)) / this.clsDuration
			);

			// calculate total time for current number of classes
			let totalTime = (clsIndex + 1) * this.clsDuration;
			console.log("--------------------------");
			console.log("totalTime (", clsIndex + 1, ") :", totalTime);
			console.log("elapsedTime (with break): ", elapsedTime.toFixed(2));
			console.log("--------------------------");

			// if id found send that or
			// (id not found mean class total time exceded) send cls end
			if (tempClsIds[clsIndex]) {
				return {
					canJoin: true,
					id: tempClsIds[clsIndex],
					timeLeft:
						totalTime -
						(elapsedTime - (this.clsDuration - 0.5)).toFixed(2),
				};
			} else {
				return {
					canJoin: false,
				};
			}
		} else if (
			elapsedTime > this.breakStart ||
			elapsedTime < this.breakEnd
		) {
			return {
				canJoin: false,
				break: true,
			};
		}
	}
}

module.exports = Watcher;
