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

export class GameState{
  constructor(){
    this.current_state = -1;
    this.state_vars = {};
  }

  get getCurrentState(){
    return this.current_state;
  }
  get getStateVars(){
    return this.state_vars;
  }

}

export var StateArray = [];


exports.GameState = GameState;
exports.StateArray = StateArray;
