/*
  server.js

  Contains server-side code for handling game events. Each event handler
  listens for client-side event requests with socket.io, performs game logic
  and updates, and responds appropriately back to the client(s).

  Internally there is a State machine that keeps track of game state. There
  is also a Player Array of Player class objects that keeps track of all
  player information during the game. The state machine and Player information
  is always updated in response to an event. Eventually, the player array will
  be implemented in a database table instead.

*/

///////////////////////////////////////////////
// Imports
///////////////////////////////////////////////
import { handleClientState, numConnectedClients } from './utils_server.js';
import { Player, PlayerArray } from './public/shared/Player.js';
import { GameState, StateArray, initGameState, setGameState, getGameState, setWordArray, getWordCard } from './public/shared/states.js';

import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import http from 'http';
import { Server } from "socket.io";

import fs from 'fs';
import csv from 'fast-csv';

///////////////////////////////////////////////
// Global variable declarations
///////////////////////////////////////////////
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);  // hack to get __dirname to work with ESModules

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// var PA;       // player array
var GS;       // GameState object
var WORDS = [];    // array of words

var CONNECTED_PLAYERS = [];
const ROOM = 'tabooo';

///////////////////////////////////////////////
// Express stuff
///////////////////////////////////////////////
// Express Middleware for serving static files: thank you - https://stackoverflow.com/questions/29357305/nodejs-express-include-local-js-file
app.use(express.static(path.join(__dirname, 'public')));

// connecting to server at <IP>:3000 returns client HTML and embedded client JS files
app.get('/', (req, res)=>{
    res.sendFile(__dirname+'/public/client.html');
});

///////////////////////////////////////////////
// Global game functions
///////////////////////////////////////////////
function initializeGame(){
  // initialize variables here
  // PA = new PlayerArray();
  // get all words from CSV: guess_word, taboo_word1,... taboo_word5
  fs.createReadStream(path.resolve(__dirname, 'words.csv'))
    .pipe(csv.parse({ headers: true }))
    .on('error', error => console.error(error))
    .on('data', row => WORDS.push(row))
    .on('end', rowCount => {setupGame();});
}

function setupGame(){
  setWordArray( WORDS );
  console.log('WORDS LENGTH: ', WORDS.length);
  GS = initGameState(['A','B'], [], WORDS.length);
}


///////////////////////////////////////////////
// Socket Event Functions
///////////////////////////////////////////////

function playerReconnecting( pinfo ){
  let reconnect_p = -1;
  for( let i=0;i<CONNECTED_PLAYERS.length;i++){
    if( CONNECTED_PLAYERS[i].pid == pinfo["clientid"]){
      reconnect_p = i;
    }
  }
  return reconnect_p;
}

/// Called when a user successfully connects (through a socket)
// the line "socket = io()" on the client-side HTML/JS file auto-connects to this server
// (which just sent the HTML/JS to the client)
io.on('connection', (socket)=>{
    console.log('user connected: '+socket.id);
    // console.log('SOCKET INFO: ', socket);
    socket.join(ROOM);

    // send 'connection-established' back to specific user
    io.to(socket.id).emit('connection-established');

    socket.on('add-player-to-game', (playerinfo)=>{
      console.log('ADDING PLAYER TO GAME', playerinfo);
      // check if player is reconnecting (saved their client ID)
      let player_reconnecting = playerReconnecting( playerinfo);
      if( player_reconnecting >= 0 ){
        GS.addPlayer(CONNECTED_PLAYERS[player_reconnecting]);
      }
      else{
        let P = new Player(playerinfo["clientid"], playerinfo["pname"], '');
        GS.addPlayer(P);
        CONNECTED_PLAYERS.push(P);
      }
      io.to(ROOM).emit('player-added', GS);
    }); // {"pid": socket.id, "pname": pname, "clientid": myid});')

    ////////////////////////////////
    // CLIENT EVENT: auto-called when this user disconnects
    ////////////////////////////////
    socket.on('disconnect', ()=>{
	     console.log('user disconnected: ', socket.id);  // socket - shows everything
       let whichid_removed = GS.removePlayerById( socket.id);
       console.log('PLAYER REMOVED: ', whichid_removed);
       console.log('CURRENT PLAYERS: ', GS.players);
       // PA.remove_playerbyid(socket.id);
       // GS.setPlayers = PA.get_players;  // ?????
       io.to(ROOM).emit('user-disconnected', {"GS": GS, "pid": socket.id});
    });


    ////////////////////////////////
    // EVENT FROM THIS CLIENT: start a new game
    ////////////////////////////////
    socket.on('start-game', ()=>{
      // initialize the game
      // GS = initGameState(['A','B'], PA.get_players, WORDS.length);
      console.log('STARTING GAME! ');
      GS.resetGameState();
      GS.assignTeams();
      console.log(GS.getPlayers);
      console.log(GS.getTeams);
      GS = handleClientState(GS, {"client_event": 'startGame', "client_state": 0});
      io.emit('update-state', GS);
    });

    socket.on('pause-game', ()=>{
      io.emit('pause-game-update');
    });

    socket.on('resume-game', ()=>{
      io.emit('resume-game-update');
    });

    socket.on('update-player-name', (pobj)=>{
      let pnum = GS.getPlayerById(pobj["pid"]);
      GS.players[pnum].name = pobj["pname"];
      io.emit('update-player-dom', GS);
    }); // {"pid": socket.id, "pname": pname});

    ////////////////////////////////
    // EVENT FROM THIS CLIENT: handle any game event
    ////////////////////////////////
    socket.on('client-event', (client_event_info)=>{
      // client_event_info JSON contains:
      // 1) "event_type": userButtonClicked, timerUp, etc...
      // 2) "client_state": # (current state ID of client)
      // then update all clients with new state information
      GS = handleClientState(GS, client_event_info);
      io.emit('update-state', GS);
      //{"state_status": state_update["state_status"],
      //                             "new_state": state_update["new_state"],
      //                             "state_vars": state_update["state_var_update_JSON"]});
    });

});

/// listen for any connection issues
io.engine.on("connection_error", (err) => {
  console.log(err.req);      // the request object
  console.log(err.code);     // the error code, for example 1
  console.log(err.message);  // the error message, for example "Session ID unknown"
  console.log(err.context);  // some additional error context
});

// NodeJS/Express server is listening on port 3000
server.listen(3000, ()=>{
    initializeGame();
    console.log('listening on *:3000');
});
