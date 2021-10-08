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
