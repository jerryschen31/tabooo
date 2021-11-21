/*
  states.js

  Contains the GameState class and StateArray object.
  The server and every client has a copy of the StateArray object, for easy
    access (so that only indexes need to be passed among server and clients)

  A GameState object contains the following:
  1) the current game state (index)
  2) all the variables that can change a state change (state_variables)
     state_variables: {
      "timer": ...
      "words_guessed_correct": ...
      "words_wrong": ...
     }

  EVERY valid event on the client-side (playing a card, moving a piece, etc...)
  will trigger an event handler on the server-side, and possibly a corresponding
  change in state with a corresponding Action method called. An action involves
  moving or updating different materials (cards, tiles etc), updating the
  Board state, and updating player information such as score and active player.

  Upon ANY event that causes a change in game state (including repeating the
  current state), the updated GameState object is passed to all clients. The
  server is responsible for the GameState object update (clients can trigger
  an update but cannot change the state variables).

  The StateArray object contains an array (list) of all possible states for the
  game and all Action functions for each state.

  Specifically, each state element in the state array is a dictionary (jSON)
  with the following KEYS:

  - "id": the numerical id for this state, same as its index in the StateArray
      Note that there are two special state IDs:
      -1: initial game state
      9999: end game state
  - "name": name of the game state
  - "description": description of the game state - this will get displayed on
      any status bar for non-active players
  - "description_ap": description of the game state for the active player(s)
  - "type": the type of game state, which can be one of the following
      - activeplayer: waiting for a single action among all active players
      - activeplayerall: waiting for an action from each active player
      - game: intermediate game state - for doing transition or cleanup stuff
      - admin: game state for any admin stuff - initial game setup, final game
          scoring,...
  - "enterstate_event": the event function that is called when the game state
       ENTERS this state
  - "instate_events": array of possible events that can trigger when in this
      game state. Some are "active" events triggered by an active player
      (e.g., discarding a card, clicking a button, etc) and some are "passive"
      events triggered by the game (e.g., timer runs out)
  - "transitions": for each possible instate event ("event"), shows the
      function that should be called upon that event ("event_handler"),
      and the next state to enter after this event finishes. Formatted as a
      list of dicts.

      The state events SHOULD BE MUTUALLY EXCLUSIVE, although state machine will
      check each event in order.

  example for tabooo:
  state: Team A is currently guessing a word on a tabooo card.

    id: 1
    name: "guess_word"
    type: activeplayer
    enterstate_event: showNextCard()
    instate_events: ["userButtonClicked", "timerUp"]
    transitions: [{"event": "timerUp", "event_handler": timerUp(), "next_state": 2},
                 {"event": "userButtonClicked", "event_handler": userButtonClicked(), "next_state": 1}]

    id: 2
    name: "time_up"
    type: game
    enterstate_event: timerUp()
    instate_events: ["endGame", "endRound"]
    transitions: {"event": "endGame", "event_handler": endGame(), "next_state": 9999},
                  "event": "endRound", "event_handler": endRound(), "next_state": 3}

    id: 3
    name: "change_active_team"
    type: game
    enterstate_event: changeActiveTeam()
    instate_events: "showNextCard"
    transitions: {"event": "showNextCard", "event_handler": showNextCard(), "next_state": 1 }

  The GameState object is GLOBAL, and care should be taken that only one
  function is updating this at any point in time.

  Any client-side event triggers the stateResolve() event server-side. Note that
  only the event that was triggered needs to be passed from client to server.
  Since any client can call stateResolve, I somehow need to handle cases when many active
  players could trigger a state change, and multiple events come into the server at almost
  the same time. We need to make sure the updates happen "in succession".

  socket.on('state-event'){
    state_status, new_state, state_var_update_JSON = stateResolve(...)
    socket.emit('state-update-clients', {state_status, new_state, state_var_update_JSON})
  }

  function stateResolve( client_event, client_state ){
    updateState( client_event, client_state )
  }
  //    then(changeState(update_to_make, state_status)).
  //    then(updateClients( updated_Gamestate object ))


  function updateState( client_event, client_state ){
    if client_state == 1 && client_event=="userButtonClicked"{
      // update game state object accordingly - call changeState()
      //  specifically new state id and updated state variables - these are passed back to all clients
      state_status = 'OK'
      new_state = 1
      state_var_update_JSON = {e.g., index of the new card to show
            - and may be different for active vs non-active players}
    }
    elif...
    }
    else{
      // if bad/illegal event occurred, set state_status as 'ILLEGAL'
    }
    return state_status, new_state, state_var_update_JSON
  }

  function changeState( update_to_make_on_gamestateobject, inStateAction ){
      // make update to game state object, if inStateAction is legal.
      newState = gamestate["transitions"]["inStateAction"]
      call function: stateArray[newState]["action"] => to enter new state
      return new_State_object
  }

  We minimize what needs to get passed among server-clients by having both server and all clients
  keep a synchronized copy of the GameState object. If ever a user disconnects and reconnects,
  the current game state object is sent to that user. Need to make super sure that users can
  never get out-of-sync. For now (prototype), perhaps the entire state variables object can be
  passed each time.
*/

/// Word Array with setter
var WA = [];

export function setWordArray( _words ){
  WA = _words;
}

export function getWordCard( _windex ){
  console.log(WA);
  console.log('in getWordCard()');
  console.log('word index', _windex);
  return WA[_windex];
}


/// GameState object with init, getter and setter
var GS;

export function initGameState( _teams = [], _players = [], _numwords = 0 ){
  GS = new GameState( _teams, _players, _numwords );
  return GS;
}

export function getGameState(){
  return GS;
}

export function setGameState( _GS ){
  GS = _GS;
}

export function replaceGameStateVars( _GS, newVars ){
  _GS.teams = newVars.teams;
  _GS.players = newVars.players;
  _GS.players_each_team = newVars.players_each_team;
  _GS.game_vars = newVars.game_vars;
  _GS.state_vars = newVars.state_vars;
  return _GS;
}

/// GameState class - holds PlayerArray, player / team states, and other game / state variables
export class GameState{
  constructor( _teams = [], _players = [], _numwords = 0 ){
    this.teams = _teams;      // array of team names - if NOT a team game, then there's only one team
    this.players = _players;  // array of Player objects
    this.players_each_team = {};  // e.g., {0: [p1,p2,p3], 1: [p4,p5,p6]} where 0 and 1 are team indexes
    this.game_vars = {
      "num_rounds": 4,       // FUTURE can be read in as input
      "starting_team": 0,    // index of the team that starts the game (if NOT a team game, there's only 1 team)
      "starting_current_player": 0,  // index of the player that starts the game for each team
      "starting_active_player": 0,    // index of the player that starts the game for each team
      "num_words": _numwords // the number of word cards to choose from
    },
    this.state_vars = {
      "previous_state": 0,
      "current_state": 0,
      "current_event": '', // event that is happening or just happened.
      "next_state": 0,
      "next_event": '',
      "state_status": 'OK',
      "current_player_each_team": {}, // index of current player within each team - e.g., {0: 0, 1: 2}
      "active_player_each_team": {},  // index of active player within each team - e.g., {0: 0, 1: 2}
      "active_team": 0,
      "current_team": 0,
      "active_player": 0,
      "current_player": 0,
      "current_round": 1,
      "word": {},  // contains guess word and 5 tabooo words
      "word_index": 0, // keep track of word indexes.
      "used_words": [] // indexes of used words from word array
    };

    // reset all player scores
    for( let i=0; i<_players.length;i++){
      this.players[i].score = 0;
    }
  }

  /// default getters and setters
  get getCurrentEvent(){
    return this.state_vars["current_event"];
  }
  get getNextEvent(){
    return this.state_vars["next_event"];
  }
  get getPreviousState(){
    return this.state_vars["previous_state"];
  }
  get getNextState(){
    return this.state_vars["next_state"];
  }
  get getTeams(){
    return this.teams;
  }
  get getPlayers(){
    return this.players;
  }
  get getPlayersEachTeam(){
    return this.players_each_team;
  }
  get getCurrentState(){
    return this.state_vars["current_state"];
  }
  get getStateStatus(){
    return this.state_vars["state_status"];
  }
  get getActiveTeam(){
    return this.state_vars["active_team"];
  }
  get getActivePlayer(){
    return this.state_vars["active_player"];
  }
  get getActivePlayerId(){
    return this.players[this.getActivePlayer].get_id;
  }
  get getCurrentTeam(){
    return this.state_vars["current_team"];
  }
  get getCurrentPlayer(){
    return this.state_vars["current_player"];
  }
  get getCurrentPlayerId(){
    let _player = this.players[this.getCurrentPlayer];
    console.log('player id: ', _player.pid);
    return _player.pid;
  }
  get getCurrentRound(){
    return this.state_vars["current_round"];
  }
  get getStartingCurrentPlayer(){
    return this.game_vars["starting_current_player"];
  }
  get getStartingActivePlayer(){
    return this.game_vars["starting_active_player"];
  }
  get getStateVars(){
    return this.state_vars;
  }
  get getGameVars(){
    return this.game_vars;
  }
  get getNumRounds(){
    return this.game_vars["num_rounds"];
  }
  get getWord(){
    return this.state_vars["word"];
  }
  get getWordIndex(){
    return this.state_vars["word_index"];
  }
  get getUsedWords(){
    return this.state_vars["used_words"];
  }
  get getNumWords(){
    return this.game_vars["num_words"];
  }

  set setCurrentEvent( _e ){
    this.state_vars["current_event"] = _e;
  }
  set setNextEvent( _e ){
    this.state_vars["next_event"] = _e;
  }
  set setNextState( _s ){
    this.state_vars["next_state"] = _s;
  }
  set setPreviousState( _s ){
    this.state_vars["previous_state"] = _s;
  }

  set setTeams( _teams ){
    this.teams = _teams;
  }
  set setPlayers( _p ){
    this.players = _p;
  }
  set setPlayersEachTeam( _t ){
    this.players_each_team = _t;
  }
  set setCurrentState( _s ){
    this.state_vars["previous_state"] = this.state_vars["current_state"];
    this.state_vars["current_state"] = _s;
  }
  set setStateStatus( _s ){
    this.state_vars["state_status"] = _s;
  }
  set setActiveTeam( _s ){
    this.state_vars["active_team"] = _s;
  }
  set setActivePlayer( _s ){
    this.state_vars["active_player"] = _s;
  }
  set setCurrentTeam( _s ){
    this.state_vars["current_team"] = _s;
  }
  set setCurrentPlayer( _s ){
    this.state_vars["current_player"] = _s;
  }
  set setCurrentRound( _s ){
    this.state_vars["current_round"] = _s;
  }
  set setStateVars( _s ){
    this.state_vars = _s;
  }
  set setGameVars( _s ){
    this.game_vars = _s;
  }
  set setNumRounds( _s ){
    this.game_vars["num_rounds"] = _s;
  }
  set setWord( _w ){
    this.state_vars["word"] = _w;
  }
  set setWordIndex( _wi ){
    this.state_vars["word_index"] = _wi;
  }
  set setUsedWords( _w ){
    this.state_vars["used_words"] = _w;
  }

  // add and remove players
  addPlayer( _p ){
    this.players.push(_p);
  }
  removePlayerById( _pid ){
    let _removed_player = -1;
    for( let i=0; i<this.players.length; i++){
      if( this.players[i].pid == _pid){
        console.log('PLAYER REMOVED: ', _pid);
        this.players.splice(i,1);
        _removed_player = i;
      }
    }
    return _removed_player;
  }

  // extra basic getters and setters
  get getNextCurrentPlayer(){
    return this.state_vars["current_player"] < this.players.length - 1 ? this.state_vars["current_player"] + 1 : 0;
  }
  get getNextActivePlayer(){
    return this.state_vars["active_player"] < this.players.length - 1 ? this.state_vars["current_player"] + 1 : 0;
  }
  get getNextCurrentTeam(){
    return this.state_vars["current_team"] < this.teams.length - 1 ? this.state_vars["current_team"] + 1 : 0;
  }
  get getNextActiveTeam(){
    return this.state_vars["active_team"] < this.teams.length - 1 ? this.state_vars["current_team"] + 1 : 0;
  }

  // other getters and setters
  setActivePlayerToCurrent(){
    this.state_vars["active_player"] = this.state_vars["current_player"];
  }
  setActiveTeamToCurrent(){
    this.state_vars["active_team"] = this.state_vars["current_team"];
  }

  // set new word (avoid used word indexes)
  setRandomWord(){
    let randomIndex = -1;
    // if we're close to reading through the whole deck, then reset
    if( this.getUsedWords.length>=this.getNumWords-1){
      this.setUsedWords = [];
    }
    do{
      randomIndex = Math.floor(Math.random()*this.getNumWords);
    } while( this.getUsedWords.indexOf(randomIndex) >= 0);
    this.setWordIndex = randomIndex;
    console.log('IN SETRANDOMWORD(): NEW WORD INDEX: ', randomIndex);
  }

  // get scores for each team (just get score of 1st player in each team), returned as dict {0: 2, 1: 3,...}
  getScoreEachTeam(){
    let _team_scores = {};
    let _teams = Object.keys(this.players_each_team);
    console.log('PLAYERS EACH TEAM: ', this.players_each_team);
    for( let i=0;i<_teams.length; i++){
      _team_scores[_teams[i]] = this.players[this.players_each_team[_teams[i]][0]].score;
    }
    return _team_scores;
  }

  // get a player from the array, by the unique ID passed in (socket ID). returns index.
  getPlayerById( _id ){
    for( let i=0;i<this.players.length;i++){
      if( this.players[i].pid == _id){
        return i;
      }
    }
    return -1;
  }

  // set up transition to next state and event, given current state and event
  setupTransitionToNextState( _sid, _se, _idx = 0 ){
    let next_sid = StateArray[_sid]["transitions"][_se][_idx];
    let next_event = StateArray[next_sid]["enterstate_event"];
    this.setNextState = next_sid;
    this.setNextEvent = next_event;
    return [next_sid, next_event]
  }
  // actually transition to next state
  transitionToNextState(){
    this.state_vars["previous_state"] = this.state_vars["current_state"];
    this.state_vars["current_state"] = this.state_vars["next_state"];
    this.state_vars["current_event"] = this.state_vars["next_event"];
    return [this.state_vars["current_state"], this.state_vars["current_event"]];
  }

  // update to next round
  updateRound(){
    this.state_vars["current_round"] = this.state_vars["current_round"] + 1;
  }
  nextRound(){
    // alias
    this.updateRound();
  }

  // player update (increment to next player) functions
  updateCurrentPlayer(){
    // by update, we mean set the next player in the array as the current player
    if( this.players.length > 0 ){
      this.state_vars["current_player"] = this.state_vars["current_player"] < this.players.length - 1 ? this.state_vars["current_player"] + 1 : 0;
    }
  }
  updateActivePlayer(){
    // by update, we mean set the next player in the array as the active player.
    if( this.players.length > 0 ){
      this.state_vars["active_player"] = this.state_vars["active_player"] < this.players.length - 1 ? this.state_vars["active_player"] + 1 : 0;
    }
  }
  updateCurrentAndActivePlayer(){
    // by update, we mean set the next player in the array as the current and active player
    if( this.players.length > 0 ){
      this.updateCurrentPlayer();
      this.state_vars["active_player"] = this.state_vars["current_player"];
    }
  }
  updateActiveAndCurrentPlayer(){
    // alias
    this.updateCurrentAndActivePlayer();
  }

  // player update (increment to next player) WITHIN A TEAM
  updateCurrentPlayerWithinTeam(){
    // by update, we mean set the next player in the array as the current player
    if( this.players.length > 0 ){
      _current_team_members = this.players_each_team[this.getCurrentTeam]
      _num_team_members = _current_team_members.length;
      _index_inteam = _current_team_members.indexOf(this.state_vars["current_player"]);
      this.state_vars["current_player"] = _index_inteam + 1 < _num_team_members ? _current_team_members[_index_inteam+1] : _current_team_members[0];
    }
  }
  updateActiveplayerWithinTeam(){
    // by update, we mean set the next player in the array as the active player.
    if( this.players.length > 0 ){
      _active_team_members = this.players_each_team[this.getActiveTeam]
      _num_team_members = _active_team_members.length;
      _index_inteam = _active_team_members.indexOf(this.state_vars["active_player"]);
      this.state_vars["active_player"] = _index_inteam + 1 < _num_team_members ? _active_team_members[_index_inteam+1] : _active_team_members[0];
    }
  }
  updateCurrentAndActivePlayerWithinTeam(){
    // by update, we mean set the next player in the array as the current and active player
    if( this.players.length > 0 ){
      this.updateCurrentPlayerWithinTeam();
      this.state_vars["active_player"] = this.state_vars["current_player"];
    }
  }

  /////////////////////////////////
  // TEAM FUNCTIONS
  /////////////////////////////////
  // assign teams - just alternates - in future can do random
  assignTeams(){
    //   this.player_teams = {} // e.g., {'A': [p1,p2,p3], 'B': [p4,p5,p6]}
    let _teamindex = 0;
    for( let i=0;i<this.players.length;i++){
      // assign player to current team index
      this.players[i].set_team = _teamindex;
      // add that player to team
      if( Object.keys(this.players_each_team).indexOf(String(_teamindex)) >= 0){
        this.players_each_team[_teamindex].push(i);
      }
      else {
        this.players_each_team[_teamindex] = [i];
      }
      // increment team index (next player gets assigned to next team)
      _teamindex = (_teamindex+this.teams.length+1) % this.teams.length;
    }
  }

  // team update (increment to next team) functions
  updateCurrentTeam(){
    // by update, we mean set the next team in the array as the current team. Note that we also need to update the current player.
    if( this.teams.length > 0 ){
      this.setCurrentTeam = this.getCurrentTeam < this.teams.length - 1 ? this.getCurrentTeam + 1 : 0;
      this.updateCurrentPlayer(); // ALSO UPDATE current player
    }
  }
  updateActiveTeam(){
    // by update, we mean set the next team in the array as the active team.
    if( this.teams.length > 0 ){
      this.setActiveTeam = this.getActiveTeam < this.teams.length - 1 ? this.getActiveTeam + 1 : 0;
      this.updateActivePlayer(); // also update active player
    }
  }
  updateCurrentAndActiveTeam(){
    // by update, we mean set the next team in the array as the current and active team
    this.updateCurrentTeam();
    this.updateActiveTeam();
  }
  updateActiveAndCurrentTeam(){
    // alias
    this.updateCurrentAndActiveTeam();
  }

  // get players within a team
  getPlayersWithinCurrentTeam(){
    let _players_each_team = this.getPlayersEachTeam;
    console.log('PLAYERS EACH TEAM: ', _players_each_team);
    return _players_each_team[this.getCurrentTeam];
  }
  getPlayersWithinActiveTeam(){
    let _players_each_team = this.getPlayersEachTeam;
    return _players_each_team[this.getActiveTeam];
  }
  getPlayersWithinNextCurrentTeam(){
    let _players_each_team = this.getPlayersEachTeam;
    return _players_each_team[this.getNextCurrentTeam];
  }
  getPlayersWithinNextActiveTeam(){
    let _players_each_team = this.getPlayersEachTeam;
    return _players_each_team[this.getNextActiveTeam];
  }

}


export var StateArray = [
  { "id": 0,
    "name": "init",
    "type": "game",
    "enterstate_event": "startGame",
    "instate_events": {"startGame": startGame},
    "transitions": {"startGame": [1]}
  },
  { "id": 1,
    "name": "guess_word",
    "type": "activeplayer",
    "enterstate_event": "showNextCard",
    "instate_events": {"correctButtonClicked": correctButtonClicked,
                          "passButtonClicked": passButtonClicked,
                                    "timerUp": timerUp,
                               "showNextCard": showNextCard },
    "transitions": {"correctButtonClicked": [1],
                       "passButtonClicked": [1],
                                 "timerUp": [2],
                            "showNextCard": [1]}
  },
  { "id": 2,
    "name": "time_up",
    "type": "game",
    "enterstate_event": "checkGameStatus",
    "instate_events": { "checkGameStatus": checkGameStatus },
    "transitions": { "checkGameStatus": [3, 5] }
  },
  { "id": 3,
    "name": "change_active_team",
    "type": "game",
    "enterstate_event": "changeActiveTeam",
    "instate_events": {"changeActiveTeam": changeActiveTeam},
    "transitions": {"changeActiveTeam": [4] }
  },
  { "id": 4,
    "name": "wait_for_next_round",
    "type": "activeplayer",
    "enterstate_event": "waitForNextRound",
    "instate_events": {"waitForNextRound": waitForNextRound,
                       "startNextRound": startNextRound},
    "transitions": {"waitForNextRound": [4],
                    "startNextRound": [1]}
  },
  { "id": 5,
    "name": "endGame",
    "type": "game",
    "enterstate_event": "finalScoring",
    "instate_events": {"finalScoring": finalScoring},
    "transitions": {"finalScoring": [5]}
  }

];

///////////////////////////////////////////////
// State Event Functions
// - should ALL take in two arguments:
//   (1) the event name that called this function,
//   (2) current state in StateArray when this event was called
// - should ALL return the next event to run (if there is an event to run next)
///////////////////////////////////////////////
function startGame( _GS, _se = 'startGame', _sid = 0, _clientid = '' ){
  // let _new_sid = StateArray[_sid]["transitions"][_se];
  let [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se);
  _GS.setStateStatus = "Team " + String(_GS.getCurrentTeam) + ": Begin Game!";
  return [_GS, _new_sid, _next_event];
}

function showNextCard( _GS, _se, _sid, _clientid = '' ){
  _GS.setRandomWord();
  _GS.setWord = getWordCard(_GS.getWordIndex);
  return [_GS, 1, ''];
}

function waitForNextRound( _GS, _se, _sid, _clientid = '' ){
  return [_GS, 4, ''];
}

function startNextRound( _GS, _se, _sid, _clientid = '' ){
  let [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se);
  //let _current_team_players = _GS.getPlayersWithinCurrentTeam();
  //let _current_team = _GS.getCurrentTeam;
  //let _current_team_score = _GS.players[_current_team_players[0]].score;
  //let _next_team_players = _GS.getPlayersWithinNextCurrentTeam();
  //let _next_team = _GS.getNextCurrentTeam; // assumes just 2 teams
  //let _next_team_score = _GS.players[_next_team_players[0]].score;
  let _current_round = _GS.getCurrentRound;

  _GS.setStateStatus = "Round "+String(_current_round) + " has started!";

  return [_GS, _new_sid, _next_event];
}

function checkGameStatus( _GS, _se, _sid, _clientid = '' ){
  // see if we go to the next round, or end the game.
  let _state_vars = _GS.getStateVars;
  let _game_vars = _GS.getGameVars;
  let _new_sid;
  let _next_event;
  if( _GS.getCurrentRound >= _GS.getNumRounds){
    [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se, 1);
  }
  else{
    [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se, 0);
  }
  return [_GS, _new_sid, _next_event];
}

function correctButtonClicked( _GS, _se, _sid, _clientid = '' ){
  // if 'correct!' button was clicked, current team gets +1
  let [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se);
  let _current_team_players = _GS.getPlayersWithinCurrentTeam();
  let _current_team = _GS.getCurrentTeam;
  let _next_team_players = _GS.getPlayersWithinNextCurrentTeam();
  let _next_team = _GS.getNextCurrentTeam; // assumes just 2 teams
  let _next_team_score = _GS.players[_next_team_players[0]].score;
  let _new_score = 0; // temporary
  // score + 1 for correct guess
  for( let i=0;i<_current_team_players.length;i++){
    _new_score = _GS.players[_current_team_players[i]].incrementScore();
  }
  // _GS.setStateStatus = "Correct! Team " + String(_current_team) + " score: " + String(_new_score) + ".";
  _GS.setStateStatus = "Correct! Team " + String(_current_team) + " scored a point.";

  return [_GS, _new_sid, StateArray[_new_sid]["enterstate_event"]];
}

function passButtonClicked( _GS, _se, _sid, _clientid = '' ){
  // if 'wrong/pass' button was clicked, current team loses -1
  let [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se);
  let _current_team_players = _GS.getPlayersWithinCurrentTeam();
  let _current_team = _GS.getCurrentTeam;
  let _next_team_players = _GS.getPlayersWithinNextCurrentTeam();
  let _next_team = _GS.getNextCurrentTeam; // assumes just 2 teams
  let _next_team_score = _GS.players[_next_team_players[0]].score;
  let _new_score = 0; // temporary
  // score - 1 for correct guess
  for( let i=0;i<_current_team_players.length;i++){
    _new_score = _GS.players[_current_team_players[i]].decrementScore();
  }
  _GS.setStateStatus = "Pass/Buzz! Team " + String(_current_team) + " lost 1 point.";

  return [_GS, _new_sid,  _next_event];
}

function timerUp( _GS, _se, _sid, _clientid = '' ){
  if( _clientid == _GS.getCurrentPlayerId){
    // if timer is up, we reset the timer
    // let _new_sid = StateArray[_sid]["transitions"][_se];
    let [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se);
    let _current_round = _GS.getCurrentRound;
    _GS.setStateStatus = "Round "+String(_current_round)+": Time is up! Up next: Team "+String(_GS.getNextCurrentTeam)+" - click Start Next Round!";
    return [_GS, _new_sid, _next_event];
  }
  else{
    return [_GS, 1, ''];
  }
}

function changeActiveTeam( _GS, _se, _sid, _clientid = ''){
  let [_new_sid, _next_event] = _GS.setupTransitionToNextState( _sid, _se);
  // update team
  _GS.updateCurrentAndActiveTeam();
  // update to next round
  _GS.updateRound();
  // if( _GS.getActivePlayer == _GS.getStartingActivePlayer){
  //  _GS.updateRound();
  // }
  return [_GS, _new_sid, _next_event];
}

function finalScoring( _GS, _se, _sid, _clientid = ''){
  console.log('GAME OVER!');
  let _current_team_players = _GS.getPlayersWithinCurrentTeam();
  let _current_team = _GS.getCurrentTeam;
  let _current_team_score = _GS.players[_current_team_players[0]].score;
  let _next_team_players = _GS.getPlayersWithinNextCurrentTeam();
  let _next_team = _GS.getNextCurrentTeam; // assumes just 2 teams
  let _next_team_score = _GS.players[_next_team_players[0]].score;
  _GS.setStateStatus = "GAME OVER! FINAL SCORES - Team " + String(_current_team) + " score: " + String(_current_team_score) + ". Team "+String(_next_team)+" score: "+String(_next_team_score);
  return [_GS, 5, ''];
}
