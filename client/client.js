/*
  client.js

  JS code that directly interfaces with client HTML page. Contains client-only
  code that server/other clients don't need to see, and imports and calls any
  common JS scripts and functions from shared/.

*/
import { GameState, StateArray, initGameState, replaceGameStateVars } from './shared/states.js';
import { Timer } from './shared/Timer.js';

var GS = initGameState();

var socket = io();
let sbutton = document.getElementById('sbutton');
let cbutton = document.getElementById('cbutton');
let wbutton = document.getElementById('wbutton');
let gtimer = document.getElementById('timer');
let infomsg = document.getElementById('infomsg');
let playerinfomsg = document.getElementById('playerinfomsg');

let word2guess_header = document.getElementById("word2guess_header");
let word2guess = document.getElementById("word2guess");
let tabheader = document.getElementById("tabheader");
let tabword1 = document.getElementById("tabword1");
let tabword2 = document.getElementById("tabword2");
let tabword3 = document.getElementById("tabword3");
let tabword4 = document.getElementById("tabword4");
let tabword5 = document.getElementById("tabword5");

var TimerObj = new Timer(0,0,15,gtimer,socket);
gtimer.innerHTML = TimerObj.getTimeString;

///////////////////////////////////////////////
// Socket Event Functions
///////////////////////////////////////////////
socket.on('connect', ()=>{
    console.log('You connected to server as: '+socket.id)
});

socket.on('disconnect', ()=>{
    console.log('User disconnected');
});

///////////////////////////////////////////////
// 'update-state' is sent by the server after it has handled an event.
// This is used to update all clients, so that client DOMs and state variables are updated accordingly.
///////////////////////////////////////////////
socket.on('update-state', stateobj=>{
    console.log('in update-state');
    // update state object - to be in sync with server.
    GS = replaceGameStateVars(GS, stateobj);
    // do any client-side DOM updates, based on current state
    updateClientDOM(GS);
    // update info message
    infomsg.innerHTML = GS.getStateStatus;
    console.log('state object sent from server to client: ', GS);
});

///////////////////////////////////////////////
// Event Listening Functions
///////////////////////////////////////////////
sbutton.addEventListener('click', function(e){
	  e.preventDefault();
    if( !hasGameStarted()){
      startGame();
      sbutton.innerHTML = "Start Next Round";
    }
    else{
      startNextRound();
    }
});

cbutton.addEventListener('click', function(e){
	  e.preventDefault();
    correctGuess();
});

wbutton.addEventListener('click', function(e){
	  e.preventDefault();
    passOrBuzz();
});


function startGame(){
  socket.emit('start-game');
}

function endRound( _current_player_id){
  console.log('in endRound()');
  // ONLY the current player should let the server know its time for the next turn.
  console.log('gamestate object: ', GS);
  if( _current_player_id == socket.id){
    console.log('in endRound(): sending timerUp client event to server');
    let client_event_info = {"client_event": 'timerUp',
                              "client_state": GS.getCurrentState,
                              "client_id": socket.id};
    socket.emit('client-event', client_event_info);
  }
  else{
    console.log('you are not the active player. do not fire an event!');
  }
}

function startNextRound(){
  let client_event_info = {"client_event": 'startNextRound',
                            "client_state": GS.getCurrentState,
                            "client_id": socket.id};
  socket.emit('client-event', client_event_info);
}

function correctGuess(){
    let client_event_info = {"client_event": 'correctButtonClicked',
                             "client_state": GS.getCurrentState,
                             "client_id": socket.id};
    socket.emit('client-event', client_event_info);
};

function passOrBuzz(){
  let client_event_info = {"client_event": 'passButtonClicked',
                           "client_state": GS.getCurrentState,
                           "client_id": socket.id};
  socket.emit('client-event', client_event_info);
};

function clientStartTimer( _current_player_id){
  TimerObj.startTimer().then(
    function(value){ endRound( _current_player_id); sbutton.style.display = "inline"; }
//    function(error){ console.log('TIMER ERROR'); }
  );
}

function hasGameStarted(){
  if( GS.getCurrentState==0){
    return false;
  }
  else{
    return true;
  }
}

////////////////////////////////////
// Client-side DOM updates
////////////////////////////////////
function updateClientDOM( _GS){
  // if we are starting a new round (changed active team)
  console.log('IN UPDATE CLIENT DOM.');
  console.log('CURRENT STATE: ', _GS.getCurrentState);
  console.log('PREVIOUS STATE: ', _GS.getPreviousState);
  // if we are at the end of a round
  if( _GS.getCurrentState == 4){
    TimerObj.stopTimer(); // stop the timer.
  }
  // if we are starting a round
  if( (_GS.getCurrentState == 1 && _GS.getPreviousState == 4) || (_GS.getCurrentState == 1 && _GS.getPreviousState == 0)) {
    console.log('IN UPDATE CLIENT DOM. NEW ROUND STARTING TIMER.');
    sbutton.style.display = "none"; // hide the start next round button
    TimerObj.resetTimer(); // this should also stop the previous timer
    clientStartTimer( _GS.getCurrentPlayerId);
  }
  // if we are in an active game (i.e., not the init state)
  if( _GS.getCurrentState != 0){
    let _player_me = _GS.getPlayerById(socket.id);
    let _team_me = _GS.players[_player_me].team;
    let _team_scores = _GS.getScoreEachTeam();
    let _teams = Object.keys(_team_scores);
    let _playerinfomsg = "You are player "+String(_player_me)+" on Team "+String(_team_me)+".";
    console.log('TEAM SCORES: ', _team_scores);
    for( let i=0; i<_teams.length; i++){
      _playerinfomsg += " Team "+String(_teams[i])+" - Score: "+String(_team_scores[_teams[i]])+". ";
    }
    playerinfomsg.innerHTML = _playerinfomsg;
    sbutton.innerHTML = "Start Next Round";
  }
  return;
}
