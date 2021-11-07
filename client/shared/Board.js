/*
  Board.js

  Class that holds spatial information for the common Board seen by all
  players. The Board is always in a given spatial state of materials, which
  is constantly updated by the State machine. Any Board changes caused by the
  client (e.g., a Card is discarded) are sent as events back to the server.
  Spatial information "changes" are then sent to other clients for updating
  their UI. Eventually, it might make sense to save the Board state in a
  database - but for now, can save in a JS array or JSON variable on the server.

  The Board can be thought of as a special Player in the game - one that is
  shared among all the human Players.

  The actual materials of the Board are kept in their own data structure, and
  the spatial information for all Board materials is kept in a separate data
  structure (which contains Board objects).

  Note that the Board materials may be different for different players / teams.
  So the Board that is seen may be different for different clients.
*/
