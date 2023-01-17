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
		let elapsedTime = await this.getElapsedTime(this.startTime);

		// create temp array of classes for current std
		let tempClsIds = await this.getTempClsIds(this.clsIds, index);

		if ((await this.breakTime(elapsedTime)) == "No Break") {
			return await this.findId(elapsedTime, tempClsIds);
		} else if ((await this.breakTime(elapsedTime)) == "Finished") {
			return await this.findId(elapsedTime, tempClsIds, true);
		} else if ((await this.breakTime(elapsedTime)) == "Break") {
			return {
				canJoin: false,
				break: true,
			};
		}
	}

	async breakTime(e) {
		if (this.breakIn > 1 || this.breakIn == 1) {
			if (
				e > this.breakStart ||
				e < this.breakEnd ||
				e === this.breakStart ||
				e === this.breakEnd
			) {
				return "Break";
			} else if (e < this.breakStart) {
				return "No Break";
			} else if (e > this.breakEnd) {
				return "Finished";
			}
		}

		return "No Break";
	}

	async isBreak(count) {
		console.log("is break called");
		if (count === this.breakIn) {
			console.log(count, this.breakIn, true);
			return true;
		} else {
			console.log(count, this.breakIn, false);
			return false;
		}
	}
	async getTempClsIds(clsids, i) {
		let ids = [...clsids];
		let firstHalf = ids.splice(i);
		return [...firstHalf, ...ids];
	}
	async getElapsedTime(st) {
		var endTime = new Date();
		var timeDiff = (endTime - st) / 1000;
		return timeDiff / 60;
	}

	async findId(e, tmpcls, isB) {
		if (isB) {
			e = e - (this.clsDuration - 0.5);
		}

		let clsIndex = Math.floor(e / this.clsDuration);
		let totalTime = (clsIndex + 1) * this.clsDuration;
		console.log("--------------------------");
		console.log("totalTime (", clsIndex + 1, ") :", totalTime);
		if (isB) {
			console.log("elapsedTime : (without break) ", e.toFixed(2));
		} else {
			console.log("elapsedTime : ", e.toFixed(2));
		}

		console.log("--------------------------");

		if (tmpcls[clsIndex]) {
			return {
				canJoin: true,
				id: tmpcls[clsIndex],
				timeLeft: totalTime - e.toFixed(2),
			};
		} else {
			return {
				canJoin: false,
			};
		}
	}
}

module.exports = Watcher;
