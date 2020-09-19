var SerialPort = require("serialport");
var port = new SerialPort("/dev/cu.HC-06-DevB", {
  baudRate: 9600
});

// port.on('open', function() {
//   port.write('1', function(err) {
//     if (err) {
//       return console.log('Error on write: ', err.message);
//     }
//     console.log('message written');
//   });
// });
port.on('open', onOpen);
 
port.on('error', onError);

port.on('data', onData);

function onOpen() {
	console.log('Connction Open');
}

function onError(err) {
	console.log('Error: ', err.message);
}

function onData(data) {
	console.log('Data: ' + data);
}