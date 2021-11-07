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
import { GameState, StateArray, initGameState, setGameState, getGameState } from './public/shared/states.js';

import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import http from 'http';
import { Server } from "socket.io";

///////////////////////////////////////////////
// Global variable declarations
///////////////////////////////////////////////
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);  // hack to get __dirname to work with ESModules

const app = express();
const server = http.createServer(app);
const io = new Server(server);

var PA;       // player array
var GS;       // GameState object

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
  PA = new PlayerArray();
}


///////////////////////////////////////////////
// Socket Event Functions
///////////////////////////////////////////////

/// Called when a user successfully connects
// the line "socket = io()" on the client-side HTML/JS file auto-connects to this server
// (which just sent the HTML/JS to the client)
io.on('connection', (socket)=>{
    console.log('user connected: '+socket.id);

    // Create a new player and add to player array
    // - but how to handle if client disconnects and reconnects? we don't want the player to pick up where he left off.
    let P = new Player(socket.id, '', '');
    PA.add_player(P);
    // Pass current game state to player (esp useful if player is re-connecting)
    // socket.emit('update-state',GS);

    ////////////////////////////////
    // EVENT FROM THIS CLIENT: start a new game
    ////////////////////////////////
    socket.on('start-game', ()=>{
      // initialize the game
      GS = initGameState(['A','B'], PA.get_players);
      GS.assignTeams();
      console.log(GS.getPlayers);
      console.log(GS.getTeams);
      GS = handleClientState(GS, {"client_event": 'startGame', "client_state": 0});
      io.emit('update-state', GS);
      // io.emit('start-timer');
    });

    // start new round - have all clients start their timers
    //socket.on('start-round', ()=>{
    //  io.emit('start-timer');
    //});

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

    ////////////////////////////////
    // CLIENT EVENT: auto-called when this user disconnects
    ////////////////////////////////
    socket.on('disconnect', (socket)=>{
	     console.log('user disconnected');
       PA.remove_playerbyid(socket.id);
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
