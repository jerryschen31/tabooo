//
// simple Timer class
//
// Counts down to zero. Using setTimeout to set per-second coundown,
//   which supposedly is not perfectly accurate.
// To prevent expensive HTTP send of timer every second, allow each client to
//   separately countdown their own timer. Again, this may cause a tiny bit of
//   out-of-sync among clients.
//

export class Timer {
  constructor( _h, _m, _s, _gtimer, _socket ){
    // countdown timer
    this.h = _h > 0 ? _h : 0;
    this.m = _m > 0 ? _m : 0;
    this.s = _s > 0 ? _s : 0;
    // other vars
    this.socket = _socket;
    this.timeup = false;
    this.gtimer = _gtimer;
    // original time - for resetting
    this.h_og = _h > 0 ? _h : 0;
    this.m_og = _m > 0 ? _m : 0;
    this.s_og = _s > 0 ? _s : 0;
  }

  get getTimerDuration(){
    // return the duration of the original timer, in milliseconds
    return this.h_og*60*60*1000 + this.m_og*60*1000 + this.s_og*1000;
  }

  get getTimeString(){
    let h_string = this.h > 0 ? (this.h < 10 ? '0'+String(this.h) : String(this.h)) : '00';
    let m_string = this.m > 0 ? (this.m < 10 ? '0'+String(this.m) : String(this.m)) : '00';
    let s_string = this.s > 0 ? (this.s < 10 ? '0'+String(this.s) : String(this.s)) : '00';
    return h_string+":"+m_string+":"+s_string;
  }
  get getTimeInt(){
    return [this.h, this.m, this.s];
  }
  get getTime(){
    return getTimeInt();
  }
  get isTimeUp(){
    return this.timeup;
  }

  resetTimer(){
    this.h = this.h_og;
    this.m = this.m_og;
    this.s = this.s_og;
    this.timeup = false;
  }

  setTime( _h, _m, _s){
    this.h = _h > 0 ? _h : 0;
    this.m = _m > 0 ? _m : 0;
    this.s = _s > 0 ? _s : 0;
  }

  printTimer(){
    const [_h, _m, _s] = this.getTimeString;
    console.log(_h,':',_m,':',_s);
  }

  updateTimer(){
    this.gtimer.innerHTML = this.getTimeString;
  }

  // countDown is a private method - gets called every second
  countDown(){
    this.s = this.s - 1;
    console.log('gtimer: ', this.getTimeString);
    // this.updateTimer();
    this.gtimer.innerHTML = this.getTimeString;

    // 00:00:00 - countDown hits zero -> exit
    if( this.s<0 && this.m==0 && this.h==0 ){
      this.timeup = true;
      return 'timeup';
    }
    // 02:00:00
    if( this.s < 0 && this.m == 0 && this.h > 0){
      this.m = 59;
      this.s = 59;
    }
    // 00:03:00
    else if( this.s < 0 && this.m > 0){
      this.m = this.m - 1;
      this.s = 59;
    }
    // 00:01:00
    else if( this.s < 0 && this.m <= 1){
      this.m = 0;
      this.s = 59;
    }
    // call countDown every second, until hit zero
    setTimeout(()=>{this.countDown()}, 1000);
  }

  // when time is up, this will return. Then calling function will send
  // socket.emit('time up') to server.
  async startTimer(){
    console.log('in start timer!!!');
    this.countDown();
    // just wait 1 minute (asynchronously) and then return
    let _status = await new Promise(function(resolve) {
      setTimeout( function(){resolve("OK");}, 15000); // this doesn't work inside setTimeout - hard-coded 5 min in ms
    });
    console.log('exiting start timer!!!'); 
    return _status;
  }

}
