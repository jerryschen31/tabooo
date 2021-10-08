/*
  states.js

  Contains the State array for the game and all Action functions for each state.

  EVERY valid event on the client-side (playing a card, moving a piece, etc...)
  will trigger an event handler on the server-side, and a corresponding change
  in state with a corresponding Action method called. An action involves
  moving or updating different materials (cards, tiles etc), updating the
  Board state, and updating player information such as score and active player.

  Each client (player) has a copy of all the possible states and the current
  state. The server in essence is just a relay for all the clients, as well as
  a store containing a copy of all the states and current game state.
*/
