const User = require("./models/user");

const generataList = async (exams, bA, bT) => {
	let examIds = [...exams].map((exam) => exam._id.toString());
	let cdIds = exams[0].students;
	let startTime = exams[0].startTime;
	let durarion = exams[0].classDuration;
	let breakAfter = bA || 0;
	let breakTime = bT || 0;

	for (let id of cdIds) {
		// console.log("list of => ", id);
		let index = cdIds.indexOf(id);
		let rooms = await getTempClsIds(
			examIds,
			index,
			startTime,
			durarion,
			breakAfter,
			breakTime
		);
		await User.findByIdAndUpdate(id, { rooms });
		console.log(rooms);
	}
};

module.exports = generataList;

let getTempClsIds = async (eIds, index, st, d, ba, bt) => {
	let ids = [...eIds];
	let firstHalf = ids.splice(index);
	let roomIds = [...firstHalf, ...ids];
	let rooms = [];

	if (ba !== 0 && ba < roomIds.length) {
		roomIds.splice(ba, 0, "break");
	}
	let bs = false;
	for (let i = 0; i < roomIds.length; i++) {
		if (roomIds[i] === "break") {
			bs = true;
			let bstt = new Date(
				Date.parse(st) + i * (d + 1) * 60 * 1000 - 1 * 60 * 1000
			).toUTCString();

			let bet = new Date(Date.parse(bstt) + bt * 60 * 1000).toUTCString();
			rooms[i - 1].delay = false;
			rooms.push({
				break: true,
				breakStt: bstt,
				breakEt: bet,
				breakTime: bt,
				delay: false,
			});
		} else {
			let stt;
			if (bs) {
				stt = new Date(
					Date.parse(st) + i * (d + 1) * 60 * 1000 - bt * 60 * 1000
				).toUTCString();
			} else {
				stt = new Date(
					Date.parse(st) + i * (d + 1) * 60 * 1000
				).toUTCString();
			}

			if (i === roomIds.length - 1) {
				rooms.push({
					roomId: roomIds[i],
					time: stt,
					durarion: d,
					isEnd: true,
					delay: false,
				});
			} else {
				rooms.push({
					roomId: roomIds[i],
					time: stt,
					durarion: d,
					delay: true,
				});
			}
		}
	}

	return rooms;
};
