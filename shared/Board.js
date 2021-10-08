/*
  Board.js

  Class that holds spatial information for the common Board seen by all
  players. The Board is always in a given spatial state of materials, which
  is constantly updated by the State machine. Any Board changes caused by the
  client (e.g., a Card is discarded) are sent as events back to the server.
  Spatial information "changes" are then sent to other clients for updating
  their UI. Eventually, it might make sense to save the Board state in a
  database - but for now, can save in a JS array or JSON variable on the server.
*/
