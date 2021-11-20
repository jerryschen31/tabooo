
function tmp2(){
    console.log("tmp2");
}

function tmp(){
    console.log("tmp");
    setTimeout(tmp2,1000);
}

tmp();
