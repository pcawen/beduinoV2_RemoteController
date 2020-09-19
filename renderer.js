const ipc = require('electron').ipcRenderer;


document.getElementById("read_file").addEventListener("click", e => {
   ipc.send('read_file', 'ping')
});

ipc.on('asynchronous-reply', function (event, arg) {
  const message = `Asynchronous message reply: ${arg}`
  document.getElementById('async-reply').innerHTML = message
});

document.getElementById("gohome").addEventListener("click", e => {
  ipc.send('go-home');
});

document.getElementById("gohome_curr_pos").addEventListener("click", e => {
  ipc.send('gohome_curr_pos');
});

ipc.on('is-connected', function (e, status) {
  if (status) document.getElementById("conn-status").classList.add("connected");
  else document.getElementById("conn-status").classList.remove("connected");
});

ipc.on('set-values', function (event, side, joint, value) {
  let label = `${side}_${joint}_val`;
  let slider = `${side}_${joint}_sldr`;
  document.getElementById(label).innerHTML = value;
  document.getElementById(slider).value = value;
});

document.getElementById("arms_up").addEventListener("click", e => {
   ipc.send('arms_up')
});
document.getElementById("arms_down").addEventListener("click", e => {
   ipc.send('arms_down')
});
document.getElementById("arms_RF_LB").addEventListener("click", e => {
  ipc.send('arms_RF_LB')
});
document.getElementById("arms_RB_LF").addEventListener("click", e => {
  ipc.send('arms_RB_LF')
});

document.getElementById("hip_left").addEventListener("click", e => {
  ipc.send('hip_left')
});
document.getElementById("hip_right").addEventListener("click", e => {
  ipc.send('hip_right')
});

document.getElementById("start_reading").addEventListener("click", e => {
  ipc.send('start_reading')
});
document.getElementById("stop_reading").addEventListener("click", e => {
  ipc.send('stop_reading')
});

//----Common event listeners----
// Capture all input events
document.getElementById("container").addEventListener("input", e => {//change
   // if (e.target !== e.currentTarget) {
   if(e.target.nodeName == 'INPUT') {//Filter only inputs type of DOM elements
      // var clickedItem = e.target.id;
      let position = e.target.valueAsNumber;
      let side = e.target.parentElement.parentElement.dataset.side;
      let joint = e.target.parentElement.parentElement.dataset.joint;
      ipc.send('move-to', side, joint, position);
      let el = `${side}_${joint}_val`;
      document.getElementById(el).innerHTML = position;
   }
   e.stopPropagation();
});

document.getElementById("container").addEventListener("click", e => {
   e.stopPropagation();
   if (e.target.nodeName == 'BUTTON') {
      let side = e.target.parentElement.parentElement.dataset.side;
      let joint = e.target.parentElement.parentElement.dataset.joint;
      let direction = e.target.dataset.dir;
      let position = ipc.sendSync('move', side, joint, direction);
      let label = `${side}_${joint}_val`;
      let slider = `${side}_${joint}_sldr`;
      document.getElementById(label).innerHTML = position;
      document.getElementById(slider).value = position;
   }
});
