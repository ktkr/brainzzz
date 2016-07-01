var session = {
    name: 'Kevin',
    FormClass: '101',
    startTime: '10',
    endTime: '50',
    Attention: ['10'],
    Meditation: ['20'],

};


function sessionUpdate() {
    var att = Math.round(100 * Math.random());
    var med = Math.round(100 * Math.random());
    session['Attention'].push(att);
    session['Meditation'].push(med);

}

function displayAttention() {
    alert(session['Attention']);
    
}

function displayMeditation() {
    alert(session['Meditation']);
    
}

function WriteFile() {
    var concentration = [session['Attention'], session['Meditation']];
    var plot = '';
    var count = 0;
    while (count < session['Attention'].length) {
        
        var plot = plot + '{' + 'x:' + session['Attention'][count] + ',' + 'y:' + session['Meditation'][count] + '}' + '\n';
        count = count + 1; //x is Attention, y is Meditation
    };
    return plot;
}

function timer() {
    var now = new Date();
    
}

function setupDL() {
    setupDownloadLink = function (link, code) {
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(code);
    };
    windows.onload = function () {
        txt.value = WriteFile() + '';
    };

}

setupDL();

function refresh() {
    txt.value = WriteFile() + '';
}
