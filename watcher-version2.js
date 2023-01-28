const Class = require("./models/class");
let roomId = "sdfdsj23432dfdfgfd";
class Watcher_V2 {
	constructor(exams, io, users, data, clearStates) {
		this.exams = exams;
		this.examIds = exams?.map((item) => item._id.toString());
		this.stdIds = [...exams[0]?.students];
		this.examIntervalTime = exams[0]?.classDuration;
		this.examInterval = exams[0]?.hasToJoin;
		this.tempIntervl = 0;
		this.breakAfter = data?.breakAfter || 0;
		this.breakTime = data?.breakDuraion || 0;
		this.isBreak = false;
		this.isDelay = false;
		this.interVal = null;
		this.states = {};
		this.io = io;
		this.users = users; // users with socket id
		this.cs = clearStates;
	}

	async start() {
		await this.markExamsAsOngoing();
		if (this.tempIntervl === 0) {
			this.io.sockets.emit("examsStarted");
		}
		this.startExam(this.tempIntervl);
		return;
	}

	startExam(examCount) {
		console.log(
			"================ Session : => ",
			examCount + 1,
			"(start) ",
			new Date().toLocaleTimeString()
		);

		if (examCount !== 0) {
			this.stdIds.forEach((id, index) => {
				let tempExamIds = this.getTempClsIds(this.examIds, index);
				this.io
					.to(id)
					.emit("examIdCd", tempExamIds[examCount].toString());
			});
		}

		setTimeout(() => {
			this.endExam(this.tempIntervl);
		}, this.examIntervalTime * 60 * 1000);
	}

	getTempClsIds(exmsIds, i) {
		let ids = [...exmsIds];
		let firstHalf = ids.splice(i);
		return [...firstHalf, ...ids];
	}

	async endExam(examCount) {
		console.log("exam end called :", new Date().toLocaleTimeString());

		this.io.sockets.emit("examEnd");

		// this.io.emit("examEnd", "message");
		// this.io.to(roomId).emit("examEnd", "message");

		this.exams.forEach((exam, index) => {
			let tempId = exam.students.at(index - examCount);

			if (!tempId) {
				tempId = exam.students[0];
			}
			exam.students.splice(exam.students.indexOf(tempId), 1);

			this.states[exam._id] = {
				ex: exam.teacher._id,
				rp: exam?.roleplayer?._id,
				cd: "",
				st: "",
			};
			// console.log("students: ", exam.students, "exam no: ", index + 1);
		});

		this.tempIntervl++;
		if (this.tempIntervl == this.examInterval) {
			await this.fireExamsEnd();
			return;
		} else {
			if (this.breakAfter == this.tempIntervl) {
				// clearInterval(this.interVal);
				console.log("break started (", this.breakTime, " m)");
				this.isBreak = true;
				this.io.sockets.emit("breakStart", this.breakTime);

				setTimeout(() => {
					console.log("break end");
					this.isBreak = false;
					this.io.sockets.emit("breakEnd");
					console.log("continueing exams");
					this.start();
				}, this.breakTime * 60 * 1000);
			} else {
				console.log("delay started :", new Date().toLocaleTimeString());

				this.io.sockets.emit("delayStart");

				this.isDelay = true;
				setTimeout(() => {
					console.log("delay end :", new Date().toLocaleTimeString());

					this.io.sockets.emit("delayEnd");
					this.isDelay = false;
					console.log("starting next exam");

					this.startExam(this.tempIntervl);
				}, 30 * 1000);
			}
		}

		// this.sendUpdate();
	}

	async fireExamsEnd() {
		console.log("===== exams ended =====");
		this.io.sockets.emit("examsEnded");
		await this.markExamsAsFinished();
		this.cs();
		return;
	}

	// rejoining

	async rejoin(id) {
		console.log("===== rejoin s =====");

		console.log("id :", id);

		if (this.isDelay) {
			console.log("delay");

			return {
				canJoin: false,
				rt: null,
				id: null,
				break: false,
				delay: true,
			};
		} else if (this.isBreak) {
			console.log("break");

			return {
				canJoin: false,
				rt: null,
				id: null,
				break: true,
				delay: false,
			};
		} else {
			let ex_id = Object.keys(this.states).find(
				(key) => this.states[key].ex === id
			);
			let rp_id = Object.keys(this.states).find(
				(key) => this.states[key].rp === id
			);
			let cd_id = Object.keys(this.states).find(
				(key) => this.states[key].cd === id
			);

			let eId;
			if (ex_id) eId = ex_id;
			if (rp_id) eId = rp_id;
			if (cd_id) eId = cd_id;

			let endTime = Date.now();
			let timeDiff = (endTime - this.states[eId].st) / 1000;
			let remainingTime = this.examIntervalTime - timeDiff / 60;

			console.log(remainingTime.toFixed(2));

			return {
				canJoin: true,
				rt: remainingTime.toFixed(2),
				id: eId,
				break: false,
				delay: false,
			};
		}

		console.log("===== rejoin e =====");
	}

	// marking exams as ongoing

	async markExamsAsOngoing() {
		await Class.updateMany(
			{
				status: "Not Started",
			},
			{
				status: "Ongoing",
			}
		);
		return true;
	}
	// marking exams as finished
	async markExamsAsFinished() {
		await Class.updateMany(
			{
				status: "Ongoing",
			},
			{
				status: "Finished",
				hasToJoin: 0,
				students: [],
			}
		);
		return true;
	}

	// get current state

	getState() {
		return this.states;
	}

	//  semding states update to admin
	sendUpdate() {
		this.io.sockets.emit("examsState", this.states);
		return;
	}

	// update users (socket id)

	updateUsers(users) {
		this.users = users;
		return;
	}
}

module.exports = Watcher_V2;
