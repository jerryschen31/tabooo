/*
  client.js

  JS code that directly interfaces with client HTML page. Contains client-only
  code that server/other clients don't need to see, and imports and calls any
  common JS scripts and functions from shared/.

*/
import { GameState, StateArray, initGameState, replaceGameStateVars } from './shared/states.js';

var GS = initGameState(); // game state object
var PA = [];              // player array object
var PA_ids = [];          // associated IDs for player array
var resetGame = true;     // toggle if we start a new game
var isPaused = false;     // is the game paused or not
var pname = '';           // your name
var _player_name_updated = false;
var alreadyPrompted = false;

var socket = io();
let sbutton = document.getElementById('sbutton');
let cbutton = document.getElementById('cbutton');
let wbutton = document.getElementById('wbutton');
let pbutton = document.getElementById('pbutton');
let gtimer = document.getElementById('timer');
let infomsg = document.getElementById('infomsg');
let playerinfomsg = document.getElementById('playerinfomsg');
let playergrid = document.getElementById('player-grid');
let worcard = document.getElementById("wordcard");
let word2guess_header = document.getElementById("word2guess_header");
let word2guess = document.getElementById("word2guess");
let tabheader = document.getElementById("tabheader");
let tabword1 = document.getElementById("tabword1");
let tabword2 = document.getElementById("tabword2");
let tabword3 = document.getElementById("tabword3");
let tabword4 = document.getElementById("tabword4");
let tabword5 = document.getElementById("tabword5");
let qrcode = document.getElementById("qrcode");
let guesscardmsg = document.getElementById("guesscardmsg");

var TimerObj = new easytimer.Timer({countdown: true, startValues: {seconds: 15}});

let QRC = new QRCode(qrcode, "http://35.160.188.146:3000");

///////////////////////////////////////////////
// Socket Event Functions
///////////////////////////////////////////////
socket.on('connect', ()=>{
    console.log('You connected to server as: '+socket.id);
});

socket.on('disconnect', ()=>{
    console.log('User disconnected');
    alreadyPrompted = false;
});

socket.on('user-connected', (PA_object)=>{
  let _PA = PA_object['PA'];  // current array of connected players
  let _P = PA_object['P'];    // newly connected player
  console.log('Existing PA from server: ', _PA);
  console.log('New Player: ', _P);
  console.log('Client PA: ', PA);
  if( alreadyPrompted == false){
    pname = window.prompt("What's your Name?",socket.id);
    alreadyPrompted = true;
  }
  addExistingPlayers(_PA);
  addPlayer(_P);  // finally add the new player
});


socket.on('user-disconnected', (_pid)=>{
  // remove DOM elements associated with the disconnected player
  removePlayer(_pid);
});

socket.on('pause-game-update', ()=>{
  TimerObj.pause();
  isPaused = true;
  pbutton.innerHTML = "Resume Game";
});

socket.on('resume-game-update', ()=>{
  TimerObj.start();
  isPaused = false;
  pbutton.innerHTML = "Pause Game";
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

// TEMP FIX TO UPDATE PLAYER NAMES - REMOVE LATER
socket.on('update-player-dom', stateobj=> {
  GS = replaceGameStateVars(GS, stateobj);
  updateClientDOM(GS);
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

pbutton.addEventListener('click', function(e){
	  e.preventDefault();
    pauseOrResumeGame();
});

TimerObj.addEventListener('secondsUpdated', function(e){
  gtimer.innerHTML = TimerObj.getTimeValues().toString();
});

TimerObj.addEventListener('targetAchieved', function(e){
  endRound( GS.getCurrentPlayerId);
});

///////////////////////////////////////////////
// Event Sub-Functions
///////////////////////////////////////////////

function startGame(){
  socket.emit('start-game');
}

function pauseOrResumeGame(){
  if( isPaused){
    socket.emit('resume-game');
  }
  else{
    socket.emit('pause-game');
  }
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
  if( GS.getCurrentPlayerId == socket.id){
    let client_event_info = {"client_event": 'correctButtonClicked',
                             "client_state": GS.getCurrentState,
                             "client_id": socket.id};
    socket.emit('client-event', client_event_info);
  }
};

function passOrBuzz(){
  if( GS.getCurrentPlayerId == socket.id){
    let client_event_info = {"client_event": 'passButtonClicked',
                           "client_state": GS.getCurrentState,
                           "client_id": socket.id};
    socket.emit('client-event', client_event_info);
  }
};

function clientStartTimer(){
  TimerObj.reset(); // this should also stop the previous timer
  TimerObj.start({ startValues: {seconds: 15}, target: {seconds: 0}});
  gtimer.innerHTML = TimerObj.getTimeValues().toString();
}

function hasGameStarted(){
  if( GS.getCurrentState==0 || resetGame==true){
    resetGame=false;
    return false;
  }
  else{
    return true;
  }
}

function addPlayer(P){
  // create new player box in player grid. global Player Array is updated.
  let psquare = document.createElement("div");
  let psquare_name = document.createElement("div");
  let psquare_team = document.createElement("div");
  let psquare_score = document.createElement("div");
  let _pid = P.pid;
  let _pname = P.name;
  let _pteam = P.team;
  let _pscore = P.score;
  PA.push(P);
  PA_ids.push(_pid);
  psquare.id = _pid;
  psquare.className = "grid-item nonactive";
  psquare_name.id = _pid+"_name";
  psquare_name.innerHTML = _pname.substring(0,12); // .substring(0,6);
  psquare_team.id = _pid+"_team";
  psquare_team.innerHTML = "Team "+String(_pteam);
  psquare_score.id = _pid+"_score";
  psquare_score.innerHTML = "Score: "+String(_pscore);
  psquare.appendChild(psquare_name);
  psquare.appendChild(psquare_team);
  psquare.appendChild(psquare_score);
  playergrid.appendChild(psquare);
}

function removePlayer(_pid){
  console.log('PID DISCONNECTED: ', _pid);
  // remove player by their unique player ID
  let psquare = document.getElementById(_pid);
  console.log('REMOVING ELEMENT', psquare);
  console.log('DOM', document);
  psquare.remove();
  // remove player from player array
  for( let i=0;i<PA.length;i++){
    if( PA[i].pid == _pid){
      PA.splice(i,1);
      PA_ids.splice(i,1);
    }
  }
}

function addExistingPlayers( _PA){
  // add any players that previously connected (if not already in player array for this client)
  // input _PA: existing player array, from server
  for( let i=0;i<_PA.length;i++){
    if( PA_ids.indexOf(_PA[i].pid) < 0){
      console.log('Adding previous player: ', _PA[i]);
      addPlayer(_PA[i]);
    }
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
    TimerObj.stop(); // stop the timer.
    gtimer.innerHTML = '00:00:00';
    pbutton.style.display = "none";    // hide the pause button
    sbutton.style.display = "inline";  // show the start next round button
  }
  // if we are starting a round
  if( (_GS.getCurrentState == 1 && _GS.getPreviousState == 4) || (_GS.getCurrentState == 1 && _GS.getPreviousState == 0)) {
    sbutton.style.display = "none";    // hide the start next round button
    pbutton.style.display = "inline";  // show the pause button

    clientStartTimer(); // start the timer for the round
  }
  // if we are just starting the game, we need to update team numbers and scores in the DOM.
  if( _GS.getCurrentState == 1 && _GS.getPreviousState == 0){
    resetGame = false; // TEMPORARY need better way to handle reset game
    qrcode.style.display = "none";
    if( _player_name_updated == false){
      socket.emit('update-player-name', {"pid": socket.id, "pname": pname});
      _player_name_updated = true;
    }
  }
  // if we are in an active game (i.e., not the init state)
  if( _GS.getCurrentState != 0){
    // my current player number and team number
    let _player_me = _GS.getPlayerById(socket.id);
    let _team_me = _GS.players[_player_me].team;
    let _active_team = _GS.getActiveTeam;
    let _active_player = _GS.getActivePlayer;

    // set me-player name - SHOULD DEF DO THIS ELSEWHERE
    // _GS.players[_player_me].name = pname;
    // console.log('PLAYER ME: ', _GS.players[_player_me].name);
    // let _player_me_name = pname == '' ? String(socket.id).substring(0,6) : pname

    // all teams and team scores
    let _team_scores = _GS.getScoreEachTeam();
    let _teams = Object.keys(_team_scores);
    let _playerinfomsg = " You are on Team "+String(_teams[_team_me])+"." // " - Score: "+String(_team_scores[_teams[_team_me]])+".";
    console.log('TEAM SCORES: ', _team_scores);
    // updatePlayerDOM( _GS);

    // if active team, then only show word card to the active player giving clues.
    if( _team_me == _active_team && _active_player != _player_me){
      guesscardmsg.style.display = "inline";
      worcard.style.display = "none";
      _playerinfomsg += " YOU ARE GUESSING THE WORD!"
    }
    else if( _team_me == _active_team && _active_player == _player_me){
      guesscardmsg.style.display = "none";
      worcard.style.display = "inline";
      _playerinfomsg += " YOU ARE GIVING CLUES!"
    }
    else{
      guesscardmsg.style.display = "none";
      worcard.style.display = "inline";
      _playerinfomsg += " IT IS OTHER TEAM'S TURN. CATCH THEM SAYING A TABOOO WORD!"
    }

    // show new word card
    let wordcard = _GS.getWord; // show new word card
    word2guess.innerHTML = wordcard["guess_word"];
    tabword1.innerHTML = wordcard["taboo_word1"];
    tabword2.innerHTML = wordcard["taboo_word2"];
    tabword3.innerHTML = wordcard["taboo_word3"];
    tabword4.innerHTML = wordcard["taboo_word4"];
    tabword5.innerHTML = wordcard["taboo_word5"];

    playerinfomsg.innerHTML = _playerinfomsg;
    sbutton.innerHTML = "Start Next Round";
  }
  // if we ended a game
  if( _GS.getCurrentState == 5){
    resetGame = true;
    sbutton.innerHTML = "Start New Game";
    pbutton.style.display = "none";
    sbutton.style.display = "inline";
    qrcode.style.display = "inline";
  }

  updatePlayerDOM( _GS);
  return;
}


function updatePlayerDOM( _GS){
  // given array of Player objects, update all player team and score info on the DOM.
  for( let i=0;i<PA.length;i++){
    let _pid = PA_ids[i]
    let pnum = _GS.getPlayerById(_pid);
    let _pteam = _GS.players[pnum].team;
    let _pscore = _GS.players[pnum].score;
    let _pname = _GS.players[pnum].name;
    let psquare = document.getElementById(_pid);
    let psquare_team = document.getElementById(_pid+"_team");
    let psquare_score = document.getElementById(_pid+"_score");
    let psquare_name = document.getElementById(_pid+"_name");

    psquare_team.innerHTML = "Team "+String(_pteam);
    psquare_score.innerHTML = "Score: "+String(_pscore);
    psquare_name.innerHTML = String(_pname.substring(0,12));

    console.log('PTEAM: ', _pteam);
    console.log('CURRENT TEAM: ', _GS.getCurrentTeam);
    console.log('PNUM: ', pnum);
    console.log('CURRENT PLAYER: ', _GS.getCurrentPlayer);

    if( _pteam == _GS.getCurrentTeam && pnum == _GS.getCurrentPlayer){
      psquare.className = "grid-item activeteam activeplayer";
    }
    else if( _pteam == _GS.getCurrentTeam && pnum != _GS.getCurrentPlayer){
      psquare.className = "grid-item activeteam";
    }
    else{
      psquare.className = "grid-item nonactive";
    }
  }
}
