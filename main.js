"use strict";
const electron = require('electron');
const path = require('path');
const url = require('url');
const SerialPort = require('serialport');
const fs = require('fs');
const readline = require('readline');
const  LineByLineReader = require('line-by-line');

// Module to control application life.
const app = electron.app;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const ipc = electron.ipcMain;

const CONNECT = process.env.NO_CONNECT ? false : true;
// const SAVE_TO_FILE = true;
const SAVE_TO_FILE = false;

// serailPort
let port = {on: () => {}};
if (CONNECT) {
	port = new SerialPort("/dev/cu.BEDUINO-DevB", {
		baudRate: 57600,//115200,
		parser: SerialPort.parsers.readline('\n')
	});
}

let isPauseReading = false;

//----------

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
const INCREMENT = 2;
const INTERVAL = 3;
// let positions = {
// 	side: {
// 		left: {
// 			arm: { value: 0, motor: 12 },
// 			hipLR: { value: 0, motor: 4 },
// 			hipFB: { value: 0, motor: 3 },
// 			knee: { value: 0, motor: 2 },
// 			ankleFB: { value: 0, motor: 1 },
// 			ankleLR: { value: 0, motor: 0 }
// 		},
// 		right: {
// 			arm: { value: 0, motor: 13 },
// 			hipLR: { value: 0, motor: 10 },
// 			hipFB: { value: 0, motor: 9 },
// 			knee: { value: 0, motor: 8 },
// 			ankleFB: { value: 0, motor: 7 },
// 			ankleLR: { value: 0, motor: 6 }
// 		},
// 	}
// };
// //------------0---1----2---3---4--X--6---7----8---9--10-xx--12-13-xx-xx
// //------------0---1----2---3---4--5--6---7----8---9--10-11--12-13-14-15
// const home = [25, 30, 14, 15, 25, 0, 17, 27, 149, 33, 4, 0, 8, 20];
let positions = {
	side: {
		left: {
			arm: { value: 0, motor: 12 },
			hipLR: { value: 0, motor: 0 },
			hipFB: { value: 0, motor: 1 },
			knee: { value: 0, motor: 2 },
			ankleFB: { value: 0, motor: 3 },
			ankleLR: { value: 0, motor: 4 }
		},
		right: {
			arm: { value: 0, motor: 13 },
			hipLR: { value: 0, motor: 6 },
			hipFB: { value: 0, motor: 7 },
			knee: { value: 0, motor: 8 },
			ankleFB: { value: 0, motor: 9 },
			ankleLR: { value: 0, motor: 10 }
		},
	}
};
//------------0---1----2---3---4--X--6---7----8---9--10-xx--12-13-xx-xx
//------------0---1----2---3---4--5--6---7----8---9---10-11-12--13-14-15
// const home = [35, 19, 14, 31, 15, 0, 60, 40, 149, 33, 10, 0, 8, 20];
const home = [90, 19, 14, 31, 15, 0, 60, 40, 149, 33, 10, 0, 8, 20];
const servoNames = [
	{side: 'left', name: 'hipLR'},
	{side: 'left', name: 'hipFB'},
	{side: 'left', name: 'knee'},
	{side: 'left', name: 'ankleFB'},
	{side: 'left', name: 'ankleLR'},
	{side: 'x', name: 'null'},
	{side: 'right', name: 'hipLR'},
	{side: 'right', name: 'hipFB'},
	{side: 'right', name: 'knee'},
	{side: 'right', name: 'ankleFB'},
	{side: 'right', name: 'ankleLR'},
	{side: 'x', name: 'null'},
	{side: 'left', name: 'arm'},
	{side: 'right', name: 'arm'}
];
let lastPositions = Array.from(home);
setCurrentValueToHome();

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

//   mainWindow.webContents.openDevTools() // Open the DevTools.

  // Emitted when the window is closed.
  mainWindow.on('closed', _ => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
    console.log('Closed!')
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
    app.quit()
  // }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// ipc.on('read_file', () => {
//   	console.log('Reading file:')
//   	let counter = 0
// 	const rl = readline.createInterface({
// 		input: fs.createReadStream(path.join(__dirname, 'data.txt'))
// 	});

// 	rl.on('line', function (line) {
// 	  if (line != '' && line[0] !== '#') {
// 		//Save current state of servos to array
// 		let split1 = line.split(',')
// 		let servo = split1[0]
// 		let position = split1[1].split('*')[0]
// 		console.log('Data: ' + servo + ' ' + position)
// 		lastPositions[servo] = parseInt(position, 10)
// 		//
// 		counter++;
// 		setTimeout((function() {
// 		  return function() {
// 			// console.log('Timeout- read line: ' + line);
// 			if (CONNECT) port.write(line);
// 		  };
// 		// }(line)), INTERVAL*counter)
// 		// }(line)), 5*counter) //Good speed
// 		}(line)), 50*counter)
// 	  }
// 	});

// 	rl.on('close', function() {
// 	  console.log('>>EOF')
// 	  // console.log(lastPositions);
// 	  updateUIWithLastPosition()
// 	});
// })
ipc.on('read_file', () => {
	console.log('Reading file line by line:')
	const lr = new LineByLineReader(path.join(__dirname, 'data.txt'))

	let counter = 0

	lr.on('error', function (err) {
		console.log('Error readig line: ', err)
	});

	lr.on('line', function (line) {
		// pause emitting of lines...
		lr.pause();

		if (line != '' && line[0] !== '#') {
			//Save current state of servos to array
			let split1 = line.split(',')
			let servo = split1[0]
			let position = split1[1].split('*')[0]
			let intPosition = parseInt(position, 10)
			if (servo == '0') {
				intPosition = intPosition + 52 // 49//Fix uncalibrated motor after crash
			}
			// if (servo == '6') { //Fixes to prevent over inclintation to the sides
			// 	intPosition = intPosition - 5
			// }
			// if (servo == '4') {
			// 	intPosition = intPosition - 2
			// }
			// if (servo == '10') {
			// 	intPosition = intPosition + 4
			// }
			line = `${servo},${intPosition}*`
			console.log(`Line: ${counter + 1} Data: ${servo} ${intPosition}`)
			lastPositions[servo] = intPosition
			//
			counter++;
			setTimeout((function() {
			return function() {
				// console.log('Timeout- read line: ' + line);
				if (CONNECT) port.write(line);
				if(!isPauseReading) lr.resume();
			};
			}(line)), 2)// ------------------Delay default 4, 3 works
		} else {
			if(!isPauseReading) lr.resume();
		}
	});
	
	lr.on('end', function () {
		console.log('All lines are read, file is closed now.')
		updateUIWithLastPosition()
	});

	ipc.on('start_reading', () => {
		isPauseReading = false
		console.log('Resume inside read_file')
		lr.resume();
	})
	ipc.on('stop_reading', () => {
		isPauseReading = true
		console.log('Pause inside read_file')
		lr.pause();
	})
})
ipc.on('go-home', () => {
	isPauseReading = false;
  	goHome()
})
ipc.on('gohome_curr_pos', () => {
	goHomeFromCurrentPosition()
})
ipc.on('move', (ev, side, joint, dir) => {
	console.log(`${side} ${joint} ${dir}`)
	let val = positions.side[side][joint].value
	if (dir === 'u') {
		val = val + INCREMENT
	} else {
		val = val - INCREMENT
	}
	ev.returnValue = val;
	move(side, joint, val)
})
ipc.on('move-to', (ev, side, joint, position) => {
	move(side, joint, position)
})
ipc.on('arms_up', () => {
  	armsUp()
})
ipc.on('arms_down', () => {
  	armsDown()
})
ipc.on('arms_RF_LB', () => {
	armsRightFrontLeftBack()
})
ipc.on('arms_RB_LF', () => {
	armsRightBackLeftFront()
})
ipc.on('hip_left', () => {
	hipLeft()
})
ipc.on('hip_right', () => {
	hipRight()
})

ipc.on('start_reading', () => {
	isPauseReading = false
})
ipc.on('stop_reading', () => {
	isPauseReading = true
})

port.on('open', onOpen)
port.on('error', onError)
port.on('data', onData)
port.on('disconnect', () => {
    console.log('Port disconnected');
});
port.on('close', () => {
    console.log('Port closed');
});

function setCurrentValueToHome() {
	positions.side.right.arm.value = home[positions.side.right.arm.motor]
	positions.side.right.hipLR.value = home[positions.side.right.hipLR.motor]
	positions.side.right.hipFB.value = home[positions.side.right.hipFB.motor]
	positions.side.right.knee.value = home[positions.side.right.knee.motor]
	positions.side.right.ankleFB.value = home[positions.side.right.ankleFB.motor]
	positions.side.right.ankleLR.value = home[positions.side.right.ankleLR.motor]
	positions.side.left.arm.value = home[positions.side.left.arm.motor]
	positions.side.left.hipLR.value = home[positions.side.left.hipLR.motor]
	positions.side.left.hipFB.value = home[positions.side.left.hipFB.motor]
	positions.side.left.knee.value = home[positions.side.left.knee.motor]
	positions.side.left.ankleFB.value = home[positions.side.left.ankleFB.motor]
	positions.side.left.ankleLR.value = home[positions.side.left.ankleLR.motor]
}

const move = (side, joint, position) => {
	let motor = positions.side[side][joint].motor
	positions.side[side][joint].value = position
	let message = motor + ',' + position + '*'
	console.log(message)
	if (SAVE_TO_FILE) saveToFile(message); //Save to file
	if (CONNECT) port.write(message)
}

function onOpen() {
	console.log('Connction Open')
	mainWindow.webContents.send('is-connected', true)
}

function onError(err) {
	console.log('Error: ', err.message)
	mainWindow.webContents.send('is-connected', false)
}

function onData(data) {
	console.log('Data: ' + data)
  	mainWindow.webContents.send('asynchronous-reply', data)
}

function goHome() {
	home.forEach(function(position, servo) {
		let servoData = servoNames[servo]
		if (servoData.side !== 'x') {
			updateUI(servoData.side, servoData.name, position);
	    	positions.side[servoData.side][servoData.name].value = position;
	    	setTimeout((function(servo, position) {
	    		return function() {
	    			let message = servo + ',' + position + '*';
					if (CONNECT) port.write(message)
	    		};
			}(servo, position)), 300*servo)
		}
	});
}

function getHomePosition(side, joint) {
	const motor = positions.side[side][joint].motor
	return home[motor]
}

function saveToFile(data) {
  fs.appendFile(path.join(__dirname, 'data.txt'), data + "\n", function (err) {
	if (err) throw err
  });
}

function updateUI(side, joint, value) {
	mainWindow.webContents.send('set-values', side, joint, value)
}

function updateUIWithLastPosition() {
	lastPositions.forEach(function(position, servo) {
		let servoData = servoNames[servo]
		if (servoData.side !== 'x') {
			updateUI(servoData.side, servoData.name, position)
	    	positions.side[servoData.side][servoData.name].value = position
		}
	});
}

function armsUp() {
	console.log('Move arms up: ')
	const interval = 20
	let run = true
	let l=positions.side.left.arm.value //posLeftArm
	let r=positions.side.right.arm.value //posRightArm
	let delay=0
	while(run) {
		console.log(`Running L: ${l} R: ${r}`)
		if (l>=-140) {
			setTimeout(move, interval*delay, 'left', 'arm', l)
			// l--
			l = l - INCREMENT
		}
		if (r<=180) {
			setTimeout(move, interval*delay, 'right', 'arm', r)
			// r++
			r = r + INCREMENT
		}
		if (l<=-140 && r>=180) {
			run=false
		}
		delay++
	}
	updateUI('left', 'arm', l)
	updateUI('right', 'arm', r)
}

function armsDown() {
	console.log('Move arms down: ')
	const interval = 20
	const leftArmHome = getHomePosition('left', 'arm')
	const rightArmHome = getHomePosition('right', 'arm')
	let run = true
	let l=positions.side.left.arm.value //posLeftArm
	let r=positions.side.right.arm.value //posRightArm
	let delay=0
	while(run) {
		console.log(`Running L: ${l} R: ${r}`)
		if (l<leftArmHome) {
			setTimeout(move, interval*delay, 'left', 'arm', l)
			// l++
			l = l + INCREMENT
		}
		if (r>rightArmHome) {
			setTimeout(move, interval*delay, 'right', 'arm', r)
			// r--
			r = r - INCREMENT
		}
		if (l>=leftArmHome && r<=rightArmHome) {
			run=false
		}
		delay++
	}
	console.log(`updateUI L: ${l} R: ${r}`)
	updateUI('left', 'arm', l)
	updateUI('right', 'arm', r)
}

function armsRightFrontLeftBack() {
	console.log('Move arms RightFrontLeftBack: ')
	const interval = 20
	let run = true
	let l=positions.side.left.arm.value //posLeftArm
	let r=positions.side.right.arm.value //posRightArm
	let delay=0
	while(run) {
		console.log(`Running L: ${l} R: ${r}`)
		if (l<=180) {
			setTimeout(move, interval*delay, 'left', 'arm', l)
			l = l + INCREMENT
		}
		if (r<=180) {
			setTimeout(move, interval*delay, 'right', 'arm', r)
			r = r + INCREMENT
		}
		if (l>=180 && r>=180) {
			run=false
		}
		delay++
	}
	updateUI('left', 'arm', l)
	updateUI('right', 'arm', r)
}

function armsRightBackLeftFront() {
	console.log('Move arms RightBackLeftFront: ')
	const interval = 20
	let run = true
	let l=positions.side.left.arm.value //posLeftArm
	let r=positions.side.right.arm.value //posRightArm
	let delay=0
	while(run) {
		console.log(`Running L: ${l} R: ${r}`)
		if (l>=-140) {
			setTimeout(move, interval*delay, 'left', 'arm', l)
			l = l - INCREMENT
		}
		if (r>=-140) {
			setTimeout(move, interval*delay, 'right', 'arm', r)
			r = r - INCREMENT
		}
		if (l<=-140 && r<=-140) {
			run=false
		}
		delay++
	}
	updateUI('left', 'arm', l)
	updateUI('right', 'arm', r)
}

function hipRight() {
	console.log('hipRight')
	const rightHipDest = 92
	const rightAnkleDest = -26
	const leftHipDest = 65
	const leftAnkleDest = -17
	moveHip(rightHipDest, rightAnkleDest, leftHipDest, leftAnkleDest)
}

function hipLeft() {
	console.log('hipLeft')
	const rightHipDest = 32
	const rightAnkleDest = 40
	const leftHipDest = 5
	const leftAnkleDest = 50
	moveHip(rightHipDest, rightAnkleDest, leftHipDest, leftAnkleDest)
}

function moveHip(rightHipDest, rightAnkleDest, leftHipDest, leftAnkleDest) {
	console.log('moveHip')
	const interval = 40
	const hipIncrement = 1
	const ankleIncrement = 1

	let hrOrigPos=positions.side.right.hipLR.value
	let arOrigPos=positions.side.right.ankleLR.value
	let hlOrigPos=positions.side.left.hipLR.value
	let alOrigPos=positions.side.left.ankleLR.value

	let hrFinished = false
	let arFinished = false
	let hlFinished = false
	let alFinished = false

	let run = true
	let hr=positions.side.right.hipLR.value
	let ar=positions.side.right.ankleLR.value
	let hl=positions.side.left.hipLR.value
	let al=positions.side.left.ankleLR.value
	let delay=0
	while(run) {
		console.log(`Running hr: ${hr} ar: ${ar} hl: ${hl} al: ${al}`)
		if (!hrFinished) {
			setTimeout(move, interval*delay, 'right', 'hipLR', hr)
			if(hr < rightHipDest) {
				hr = hr + hipIncrement
			} else {
				hr = hr - hipIncrement
			}
		}
		if (!arFinished) {
			setTimeout(move, interval*delay, 'right', 'ankleLR', ar)
			if(ar < rightAnkleDest) {
				ar = ar + ankleIncrement
			} else {
				ar = ar - ankleIncrement
			}
		}

		if (!hlFinished) {
			setTimeout(move, interval*delay, 'left', 'hipLR', hl)
			if(hl < leftHipDest) {
				hl = hl + hipIncrement
			} else {
				hl = hl - hipIncrement
			}
		}
		if (!alFinished) {
			setTimeout(move, interval*delay, 'left', 'ankleLR', al)
			if(al < leftAnkleDest) {
				al = al + ankleIncrement
			} else {
				al = al - ankleIncrement
			}
		}

		if (hrOrigPos < rightHipDest ) {
			if (hr >= rightHipDest) hrFinished = true
		} else {
			if (hr <= rightHipDest) hrFinished = true
		}
		if (arOrigPos < rightAnkleDest ) {
			if (ar >= rightAnkleDest) arFinished = true
		} else {
			if (ar <= rightAnkleDest) arFinished = true
		}
		if (hlOrigPos < leftHipDest ) {
			if (hl >= leftHipDest) hlFinished = true
		} else {
			if (hl <= leftHipDest) hlFinished = true
		}
		if (alOrigPos < leftAnkleDest ) {
			if (al >= leftAnkleDest) alFinished = true
		} else {
			if (al <= leftAnkleDest) alFinished = true
		}

		console.log(`All Finished? hr: ${hrFinished} ar: ${arFinished} hl: ${hlFinished} al: ${alFinished}`)
		if (hrFinished && arFinished && hlFinished && alFinished) {
			run=false
		}
		delay++
	}
	console.log(`updateUI hr: ${hr} ar: ${ar} hl: ${hl} al: ${al}`)
	updateUI('right', 'hipLR', hr)
	updateUI('right', 'ankleLR', ar)
	updateUI('left', 'hipLR', hl)
	updateUI('left', 'ankleLR', al)
}

function goHomeFromCurrentPosition() {
	const rArmDest=home[13]
	const rHipLRDest=home[6]
	const rHipFBDest=home[7]
	const rKneeDest=home[8]
	const rAnkleFBDest=home[9]
	const rAnkleLRDest=home[10]
	const lArmDest=home[12]
	const lHipLRDest=home[0]
	const lHipFBDest=home[1]
	const lKneeDest=home[2]
	const lAnkleFBDest=home[3]
	const lAnkleLRDest=home[4]

	goToFromCurrentPosition(rArmDest, rHipLRDest, rHipFBDest, rKneeDest, rAnkleFBDest, rAnkleLRDest, lArmDest, lHipLRDest, lHipFBDest, lKneeDest, lAnkleFBDest, lAnkleLRDest)
}

function goToFromCurrentPosition(rArmDest, rHipLRDest, rHipFBDest, rKneeDest, rAnkleFBDest, rAnkleLRDest, lArmDest, lHipLRDest, lHipFBDest, lKneeDest, lAnkleFBDest, lAnkleLRDest) {

	const interval = 30
	const increment = 2

	const rArmOrigPos=positions.side.right.arm.value
	const rHipLROrigPos=positions.side.right.hipLR.value
	const rHipFBOrigPos=positions.side.right.hipFB.value
	const rKneeOrigPos=positions.side.right.knee.value
	const rAnkleFBOrigPos=positions.side.right.ankleFB.value
	const rAnkleLROrigPos=positions.side.right.ankleLR.value
	const lArmOrigPos=positions.side.left.arm.value
	const lHipLROrigPos=positions.side.left.hipLR.value
	const lHipFBOrigPos=positions.side.left.hipFB.value
	const lKneeOrigPos=positions.side.left.knee.value
	const lAnkleFBOrigPos=positions.side.left.ankleFB.value
	const lAnkleLROrigPos=positions.side.left.ankleLR.value

	let rArmPos=positions.side.right.arm.value
	let rHipLRPos=positions.side.right.hipLR.value
	let rHipFBPos=positions.side.right.hipFB.value
	let rKneePos=positions.side.right.knee.value
	let rAnkleFBPos=positions.side.right.ankleFB.value
	let rAnkleLRPos=positions.side.right.ankleLR.value
	let lArmPos=positions.side.left.arm.value
	let lHipLRPos=positions.side.left.hipLR.value
	let lHipFBPos=positions.side.left.hipFB.value
	let lKneePos=positions.side.left.knee.value
	let lAnkleFBPos=positions.side.left.ankleFB.value
	let lAnkleLRPos=positions.side.left.ankleLR.value

	let rArmFinished = false
	let rHipLRFinished = false
	let rHipFBFinished = false
	let rKneeFinished = false
	let rAnkleFBFinished = false
	let rAnkleLRFinished = false
	let lArmFinished = false
	let lHipLRFinished = false
	let lHipFBFinished = false
	let lKneeFinished = false
	let lAnkleFBFinished = false
	let lAnkleLRFinished = false

	let run = true
	let delay=0

	while(run) {
		if (!rArmFinished) {
			setTimeout(move, interval*delay, 'right', 'arm', rArmPos)
			if(rArmPos < rArmDest) {
				rArmPos = rArmPos + increment
			} else {
				rArmPos = rArmPos - increment
			}
		}

		if (!rHipLRFinished) {
			setTimeout(move, interval*delay, 'right', 'hipLR', rHipLRPos)
			if(rHipLRPos < rHipLRDest) {
				rHipLRPos = rHipLRPos + increment
			} else {
				rHipLRPos = rHipLRPos - increment
			}
		}
		if (!rHipFBFinished) {
			setTimeout(move, interval*delay, 'right', 'hipFB', rHipFBPos)
			if(rHipFBPos < rHipFBDest) {
				rHipFBPos = rHipFBPos + increment
			} else {
				rHipFBPos = rHipFBPos - increment
			}
		}
		if (!rKneeFinished) {
			setTimeout(move, interval*delay, 'right', 'knee', rKneePos)
			if(rKneePos < rKneeDest) {
				rKneePos = rKneePos + increment
			} else {
				rKneePos = rKneePos - increment
			}
		}
		if (!rAnkleFBFinished) {
			setTimeout(move, interval*delay, 'right', 'ankleFB', rAnkleFBPos)
			if(rAnkleFBPos < rAnkleFBDest) {
				rAnkleFBPos = rAnkleFBPos + increment
			} else {
				rAnkleFBPos = rAnkleFBPos - increment
			}
		}
		if (!rAnkleLRFinished) {
			setTimeout(move, interval*delay, 'right', 'ankleLR', rAnkleLRPos)
			if(rAnkleLRPos < rAnkleLRDest) {
				rAnkleLRPos = rAnkleLRPos + increment
			} else {
				rAnkleLRPos = rAnkleLRPos - increment
			}
		}
		if (!lArmFinished) {
			setTimeout(move, interval*delay, 'left', 'arm', lArmPos)
			if(lArmPos < lArmDest) {
				lArmPos = lArmPos + increment
			} else {
				lArmPos = lArmPos - increment
			}
		}
		if (!lHipLRFinished) {
			setTimeout(move, interval*delay, 'left', 'hipLR', lHipLRPos)
			if(lHipLRPos < lHipLRDest) {
				lHipLRPos = lHipLRPos + increment
			} else {
				lHipLRPos = lHipLRPos - increment
			}
		}
		if (!lHipFBFinished) {
			setTimeout(move, interval*delay, 'left', 'hipFB', lHipFBPos)
			if(lHipFBPos < lHipFBDest) {
				lHipFBPos = lHipFBPos + increment
			} else {
				lHipFBPos = lHipFBPos - increment
			}
		}
		if (!lKneeFinished) {
			setTimeout(move, interval*delay, 'left', 'knee', lKneePos)
			if(lKneePos < lKneeDest) {
				lKneePos = lKneePos + increment
			} else {
				lKneePos = lKneePos - increment
			}
		}
		if (!lAnkleFBFinished) {
			setTimeout(move, interval*delay, 'left', 'ankleFB', lAnkleFBPos)
			if(lAnkleFBPos < lAnkleFBDest) {
				lAnkleFBPos = lAnkleFBPos + increment
			} else {
				lAnkleFBPos = lAnkleFBPos - increment
			}
		}
		if (!lAnkleLRFinished) {
			setTimeout(move, interval*delay, 'left', 'ankleLR', lAnkleLRPos)
			if(lAnkleLRPos < lAnkleLRDest) {
				lAnkleLRPos = lAnkleLRPos + increment
			} else {
				lAnkleLRPos = lAnkleLRPos - increment
			}
		}

		if (rArmOrigPos < rArmDest ) {
			if (rArmPos >= rArmDest) rArmFinished = true
		} else {
			if (rArmPos <= rArmDest) rArmFinished = true
		}
		if (rHipLROrigPos < rHipLRDest ) {
			if (rHipLRPos >= rHipLRDest) rHipLRFinished = true
		} else {
			if (rHipLRPos <= rHipLRDest) rHipLRFinished = true
		}
		if (rHipFBOrigPos < rHipFBDest ) {
			if (rHipFBPos >= rHipFBDest) rHipFBFinished = true
		} else {
			if (rHipFBPos <= rHipFBDest) rHipFBFinished = true
		}
		if (rKneeOrigPos < rKneeDest ) {
			if (rKneePos >= rKneeDest) rKneeFinished = true
		} else {
			if (rKneePos <= rKneeDest) rKneeFinished = true
		}
		if (rAnkleFBOrigPos < rAnkleFBDest ) {
			if (rAnkleFBPos >= rAnkleFBDest) rAnkleFBFinished = true
		} else {
			if (rAnkleFBPos <= rAnkleFBDest) rAnkleFBFinished = true
		}
		if (rAnkleLROrigPos < rAnkleLRDest ) {
			if (rAnkleLRPos >= rAnkleLRDest) rAnkleLRFinished = true
		} else {
			if (rAnkleLRPos <= rAnkleLRDest) rAnkleLRFinished = true
		}
		if (lArmOrigPos < lArmDest ) {
			if (lArmPos >= lArmDest) lArmFinished = true
		} else {
			if (lArmPos <= lArmDest) lArmFinished = true
		}
		if (lHipLROrigPos < lHipLRDest ) {
			if (lHipLRPos >= lHipLRDest) lHipLRFinished = true
		} else {
			if (lHipLRPos <= lHipLRDest) lHipLRFinished = true
		}
		if (lHipFBOrigPos < lHipFBDest ) {
			if (lHipFBPos >= lHipFBDest) lHipFBFinished = true
		} else {
			if (lHipFBPos <= lHipFBDest) lHipFBFinished = true
		}
		if (lKneeOrigPos < lKneeDest ) {
			if (lKneePos >= lKneeDest) lKneeFinished = true
		} else {
			if (lKneePos <= lKneeDest) lKneeFinished = true
		}
		if (lAnkleFBOrigPos < lAnkleFBDest ) {
			if (lAnkleFBPos >= lAnkleFBDest) lAnkleFBFinished = true
		} else {
			if (lAnkleFBPos <= lAnkleFBDest) lAnkleFBFinished = true
		}
		if (lAnkleLROrigPos < lAnkleLRDest ) {
			if (lAnkleLRPos >= lAnkleLRDest) lAnkleLRFinished = true
		} else {
			if (lAnkleLRPos <= lAnkleLRDest) lAnkleLRFinished = true
		}

		if (rArmFinished && rHipLRFinished && rHipFBFinished && rKneeFinished && rAnkleFBFinished && rAnkleLRFinished && lArmFinished && lHipLRFinished && lHipFBFinished && lKneeFinished && lAnkleFBFinished && lAnkleLRFinished) {
			run=false
		}
		delay++
	}
	updateUI('right', 'arm', rArmPos)
	updateUI('right', 'hipLR', rHipLRPos)
	updateUI('right', 'hipFB', rHipFBPos)
	updateUI('right', 'knee', rKneePos)
	updateUI('right', 'ankleFB', rAnkleFBPos)
	updateUI('right', 'ankleLR', rAnkleLRPos)
	updateUI('left', 'arm', lArmPos)
	updateUI('left', 'hipLR', lHipLRPos)
	updateUI('left', 'hipFB', lHipFBPos)
	updateUI('left', 'knee', lKneePos)
	updateUI('left', 'ankleFB', lAnkleFBPos)
	updateUI('left', 'ankleLR', lAnkleLRPos)
}
