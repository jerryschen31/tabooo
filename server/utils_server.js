/*
  utils_server.js

  Contains any useful server-side utility functions.

*/
import { StateArray, setGameState, getGameState } from './public/shared/states.js';

// count number of connected clients using socket.io
export function numConnectedClients( io ){
  return io.engine.clientsCount;
}

export function handleClientState( GSnew, client_event_info ){
  /* *****************
    Handle a client state-change event. This is the core of the state machine on the server-side.

    input: GSnew - the current GameState object
           client_event_info - {"client_event": '<EVENT STRING>',
                                "client_state": STATE_ID,
                                "client_id": SOCKET_ID} // need to know who fired the event
    output: GSnew - updated GameState object

    In the future, maybe just pass the state variables that changed, as a JSON.
  ********************/
  let _state_id = client_event_info["client_state"];
  let _next_state_event = client_event_info["client_event"]; // next state client event to execute
  let _client_id = client_event_info["client_id"];
  console.log('CLIENT ID: ', _client_id);
  console.log('STATE ID: ', _state_id);
  console.log('NEXT STATE EVENT: ', _next_state_event);

  // First check if "client_event" is a valid event, given the current state
  if( Object.keys(StateArray[_state_id]["instate_events"]).indexOf(_next_state_event) >= 0){
    // Run the passed-in client state event function => return the next state ID and the "enter" event for the next state
    console.log('EVENT FUNCTION RUN: ', StateArray[_state_id]["instate_events"][_next_state_event]);
    [GSnew, _state_id, _next_state_event] = StateArray[_state_id]["instate_events"][_next_state_event](GSnew, _next_state_event, _state_id, _client_id);

    do{
      // Then transition into the new state after this state event, and run the new state's "enter" event
      // [_state_id, _next_state_event] = GSnew.transitionToNextState();
      GSnew.setCurrentState = _state_id;
      console.log('PREVIOUS GAME STATE: ', GSnew.getPreviousState);
      console.log('NEXT GAME STATE: ', _state_id);
      console.log('ENTER EVENT FOR NEXT STATE: ', _next_state_event);
      if( _next_state_event!=''){
        [GSnew, _state_id, _next_state_event] = StateArray[_state_id]["instate_events"][_next_state_event](GSnew, _next_state_event, _state_id, _client_id);
      }
      // Keep running the "enter" event and transition while we are in a 'game' state.
    } while( StateArray[GSnew.getCurrentState]["type"] == "game" && _next_state_event != '');
  }
  else{
    // not a valid event - let client know.
    console.log(client_event_info);
    console.log('NOT A VALID CLIENT EVENT GIVEN STATE: ', _state_id);
  }
  return GSnew;
}
