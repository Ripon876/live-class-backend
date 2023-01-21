class Watcher_V2 {
	constructor(exams, io, users) {
		this.exams = exams;
		this.examIds = exams?.map((item) => item._id.toString());
		this.stdIds = exams[0]?.students;
		this.examIntervalTime = exams[0]?.classDuration;
		this.examInterval = exams[0]?.hasToJoin;
		this.tempIntervl = 0;
		this.states = {};
		this.io = io;
		this.users = users; // users with socket id
		// this.isEnd = false;
	}

	start() {
		this.exams.map((exam) => (exam.status = "Ongoing"));
		this.startExam(this.tempIntervl);
		let tempI = setInterval(() => {
			if (this.tempIntervl == this.examInterval - 1) {
				console.log("===== exams ended =====");
				clearInterval(tempI);
				return;
			} else {
				this.endExam(this.tempIntervl);
			}
		}, this.examIntervalTime * 60 * 1000);
		return;
	}

	startExam(examCount) {
		console.log("================ Session : => ", examCount + 1, "(end)");
		this.exams.forEach((exam, index) => {
			if (examCount === 0) {
				this.io
					.to(this.users[exam.teacher._id])
					.emit("examIdEx", exam._id);
			}
			if (exam?.roleplayer) {
				this.io
					.to(this.users[exam.roleplayer._id])
					.emit("examIdRp", exam._id);
			}
			let tempId = exam.students.at(index - examCount);

			if (!tempId) {
				tempId = exam.students[0];
			}

			this.io.to(this.users[tempId]).emit("examIdEx", exam._id);

			this.states[exam._id] = {
				ex: exam.teacher._id,
				cd: tempId,
				st: Date.now(),
			};
			// console.log("students: ", exam.students, "exam no: ", index + 1);
		});

		console.log(this.states);
		console.log("================ Session : => ", examCount + 1, "(end)");
	}
	endExam(examCount) {
		console.log("exam end called");
		this.io.sockets.emit("examEnd");

		this.exams.forEach((exam, index) => {
			let tempId = exam.students.at(index - examCount);

			if (!tempId) {
				tempId = exam.students[0];
			}
			exam.students.splice(exam.students.indexOf(tempId), 1);

			this.states[exam._id] = {
				ex: exam.teacher._id,
				cd: "",
				st: "",
			};
			// console.log("students: ", exam.students, "exam no: ", index + 1);
		});
		this.tempIntervl++;
		console.log("delay started");
		setTimeout(() => {
			console.log("delay end");
			console.log("calling startExam again");

			this.startExam(this.tempIntervl);
		}, 2 * 1000);
	}
}

module.exports = Watcher_V2;
