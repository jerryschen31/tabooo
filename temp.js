
let TEAM = 'A';

function changeTeam(){
    if( TEAM=='A' ){
	TEAM = 'B';
    }
    else{
	TEAM = 'A';
    }
    console.log(TEAM);
    return;
}

changeTeam();
changeTeam();
changeTeam();
changeTeam();