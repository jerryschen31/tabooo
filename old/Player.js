/*
  Player.js

  Class that contains all player information, including a player's score,
  his current materials (cards, tiles, coins), etc...

  Both client and server keep a copy of the Player array and each Player's
  current state. Each client knows which player ID is "self".

  A separate Player array class object holds an array of all Players in the
  game, the current player, and the active player. For turn-based games, the
  current player is the player whose current turn it is; the active player is
  the player called to do an action (usually but NOT necessarily the current
  player - for example, if a trade is happening between the current player and
  another player). For simultaneous games, the current player is just set as
  the host player; the active player is the player who just did the last action
  or event.

*/

class Player{
  // PID is required and cannot be changed once initialized.
  constructor( _pid, _name = '', _team = '', _score = 0 ){
    this.name = _name;
    this.team = _team;
    this.pid = _pid;
    this.score = _score;
  }

  get print_player_info(){
    console.log('pid: ', this.pid, ' / name: ', this.name, ' / team: ', this.team, ' / score: ', this.score);
    return {'name': this.name, 'team': this.team, 'pid': this.pid, 'score': this.score};
  }

  get get_team(){
    return this.team;
  }
  set set_team( _team ){
    this.team = _team;
  }

  get get_id(){
    return this.pid;
  }
  set set_id( _id ){
    this.pid = _id;
  }

  get get_score(){
    return this.score;
  }
  set set_score( _score ){
    this.score = _score;
  }
  set add_score( _score ){
    this.score += _score;
  }
  set subtract_score( _score ){
    this.score -= _score;
  }
}


// maybe think about a dict structure for faster access
class PlayerArray{
  constructor( _players = [], _current_player = -1, _active_player = -1 ){
    this.players = _players;
    this.current_player = _current_player;
    this.active_player = _active_player;
  }

  // get all players information
  get print_playerarray_info(){
    for( i=0;i<this.players.length;i++){
      this.players[i].print_player_info();
    }
    return {'players': this.players, 'current_player': this.current_player, 'active_player': this.active_player};
  }
  // basic getter and setter
  get get_players(){
    return this.players;
  }
  set set_players( _players ){
    this.players = _players;
  }

  // add and remove individual players
  set add_player( _player ){
    this.players.push(_player);
    if( this.players.length == 1){
      this.current_player = 0;
      this.active_player = 0;
    }
  }
  set remove_playerbyid( _id ){
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].pid == _id ){
        this.players.splice(i,1);
      }
    }
  }
  set remove_playerbyname( _name ){
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].name == _name ){
        this.players.splice(i,1);
      }
    }
  }

  // get player(s) by various fields (id, name, team, score)
  get_playerbyid( _id, field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    let return_val = -1;
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].pid == _id ){
        if( field2return=='index' ){
          return_val = i;
        }
        else if( field2return=='name'){
          return_val = this.players[i].name;
        }
        else if( field2return=='id'){
          return_val = this.players[i].pid;
        }
        else if( field2return=='team'){
          return_val = this.players[i].team;
        }
        else if( field2return=='score'){
          return_val = this.players[i].score;
        }
        return return_val;
      }
    }
  }

  get_playerbyname( _name, field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    let return_val = -1;
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].name == _name ){
        if( field2return=='index' ){
          return_val = i;
        }
        else if( field2return=='name'){
          return_val = this.players[i].name;
        }
        else if( field2return=='id'){
          return_val = this.players[i].pid;
        }
        else if( field2return=='team'){
          return_val = this.players[i].team;
        }
        else if( field2return=='score'){
          return_val = this.players[i].score;
        }
        return return_val;
      }
    }
  }

  get_playersbyteam( _team, field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    let return_val = [];
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].name == _name ){
        if( field2return=='index' ){
          return_val.push(i);
        }
        else if( field2return=='name'){
          return_val.push(this.players[i].name);
        }
        else if( field2return=='id'){
          return_val.push(this.players[i].pid);
        }
        else if( field2return=='team'){
          return_val.push(this.players[i].team);
        }
        else if( field2return=='score'){
          return_val.push(this.players[i].score);
        }
      }
    }
    return return_val;
  }

  get_playerbyhighscore( field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    // returns a list, just in case there is a tie. Can always just grab the first element.
    let return_val = [];
    let high_score = -100;
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].score >= high_score ){
        high_score = this.players[i].score;
        if( field2return=='index' ){
          return_val.push(i);
        }
        else if( field2return=='name'){
          return_val.push(this.players[i].name);
        }
        else if( field2return=='id'){
          return_val.push(this.players[i].pid);
        }
        else if( field2return=='team'){
          return_val.push(this.players[i].team);
        }
        else if( field2return=='score'){
          return_val.push(this.players[i].score);
        }
      }
    }
    return return_val;
  }

  get_playerbylowscore( field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    // returns a list, just in case there is a tie. Can always just grab the first element.
    let return_val = [];
    let low_score = 99999999;
    for( i=0;i<this.players.length;i++ ){
      if( this.players[i].score <= low_score ){
        low_score = this.players[i].score;
        if( field2return=='index' ){
          return_val.push(i);
        }
        else if( field2return=='name'){
          return_val.push(this.players[i].name);
        }
        else if( field2return=='id'){
          return_val.push(this.players[i].pid);
        }
        else if( field2return=='team'){
          return_val.push(this.players[i].team);
        }
        else if( field2return=='score'){
          return_val.push(this.players[i].score);
        }
      }
    }
    return return_val;
  }

  // getters and setters for current and active player.
  get get_currentplayer(){
    return this.current_player;
  }
  get get_nextcurrentplayer(){
    if( this.players.length > 0 ){
      return this.current_player + 1 ? this.current_player < this.players.length - 1 : 0;
    } else {
      return -1
    }
  }
  set set_currentplayer( _current_player ){
    return this.current_player = _current_player;
  }

  update_currentplayer(){
    // by update, we mean set the next player in the array as the current player
    if( this.players.length > 0 ){
      this.current_player = this.current_player + 1 ? this.current_player < this.players.length - 1 : 0;
    } else {
      this.current_player = -1;
    }
  }

  get get_activeplayer(){
    return this.active_player;
  }
  get get_nextactiveplayer(){
    if( this.players.length > 0 ){
      return this.active_player + 1 ? this.active_player < this.players.length - 1 : 0;
    } else {
      return -1
    }
  }
  set set_activeplayer( _active_player ){
    return this.active_player = _active_player;
  }

  update_activeplayer(){
    // by update, we mean set the next player in the array as the active player.
    if( this.players.length > 0 ){
      this.active_player = this.active_player + 1 ? this.active_player < this.players.length - 1 : 0;
    } else {
      this.active_player = -1;
    }
  }

  set_activeplayertocurrent(){
    this.active_player = this.current_player;
  }

  update_currentandactiveplayer(){
    // by update, we mean set the next player in the array as the current and active player
    if( this.players.length > 0 ){
      this.current_player = this.current_player + 1 ? this.current_player < this.players.length - 1 : 0;
      this.active_player = this.current_player;
    } else {
      this.current_player = -1;
      this.active_player = -1;
    }
  }
}

exports.Player = Player;
exports.PlayerArray = PlayerArray;
