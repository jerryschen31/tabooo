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

export class Player{
  // PID is required and cannot be changed once initialized.
  constructor( _pid, _name = '', _team = None, _score = 0 ){
    this.name = _pid; // _name; - temporary
    this.team = _team; // team index
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
  incrementScore(){
    this.score = this.score+1;
    return this.score;
  }
  decrementScore(){
    this.score = this.score-1;
    return this.score;
  }
}

// maybe think about a dict structure for faster access
export class PlayerArray{
  constructor( _players = [] ){
    this.players = _players;
  }

  // get all players information _ logs to console
  get print_playerarray_info(){
    for( let i=0;i<this.players.length;i++){
      this.players[i].print_player_info();
    }
    return {"players": this.players};
  }

  // basic getter and setters
  get get_players(){
    return this.players;
  }
  set set_players( _players ){
    this.players = _players;
  }

  // add and remove individual players
  add_player( _player ){
    this.players.push(_player);
    if( this.players.length == 1){
      this.current_player = 0;
      this.active_player = 0;
    }
  }
  remove_playerbyid( _id ){
    for( let i=0;i<this.players.length;i++ ){
      if( this.players[i].pid == _id ){
        this.players.splice(i,1);
      }
    }
  }
  remove_playerbyname( _name ){
    for( let i=0;i<this.players.length;i++ ){
      if( this.players[i].name == _name ){
        this.players.splice(i,1);
      }
    }
  }

  // get player(s) by various fields (id, name, team, score)
  get_playerbyid( _id, field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    let return_val = -1;
    for( let i=0;i<this.players.length;i++ ){
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
    for( let i=0;i<this.players.length;i++ ){
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
    let _teamindex = (typeof _team == 'number') ? _team : this.teams[_team]; // accept team as string or index
    for( let i=0;i<this.player_teams[_teamindex].length;i++ ){
      if( field2return=='index' ){
        return_val.push(this.player_teams[_teamindex][i]);
      }
      else if( field2return=='name'){
        return_val.push(this.players[this.player_teams[_teamindex][i]].name);
      }
      else if( field2return=='id'){
        return_val.push(this.players[this.player_teams[_teamindex][i]].pid);
      }
      else if( field2return=='team'){
        return_val.push(this.players[this.player_teams[_teamindex][i]].team);
      }
      else if( field2return=='score'){
        return_val.push(this.players[this.player_teams[_teamindex][i]].score);
      }
    }
    return return_val;
  }

  get_playerbyhighscore( field2return = 'index' ){
    // field2return: 'index', 'name', 'id', 'team', 'score'
    // returns a list, just in case there is a tie. Can always just grab the first element.
    let return_val = [];
    let high_score = -100;
    for( let i=0;i<this.players.length;i++ ){
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
    for( let i=0;i<this.players.length;i++ ){
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

}
