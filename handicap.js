$(document).ready(function(){
    $('#newrace form').submit(saveRace);
	$('#newrace form').submit(setTitle);
	$('#enterhandicaps form').submit(savePrediction);
	// create database to hold data on predicted and actual times
	var shortName = 'Handicaps';
    var version = '1.0';
    var displayName = 'Handicaps';
    var maxSize = 65536;
    db = openDatabase(shortName, version, displayName, maxSize);
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS predictions (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, runner TEXT NOT NULL, prediction INTEGER NOT NULL );'
            );
        }
    );
}
);

function saveRace() {
    localStorage.date = $('#date').val();
    localStorage.distance = $('#distance').val();
    localStorage.racename = $('#racename').val();
    jQT.goTo('#existingrace');
    return false;
}

function setTitle() {
	$('#racename').val(localStorage.racename);
	document.getElementById('existingracetitle').innerHTML = document.getElementById('racename').value;
}

function savePrediction() {
	var racename = document.getElementById('racename').value;
    var runner = $('#runner').val();
    var prediction = $('#prediction').val();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO predictions (racename, runner, prediction) VALUES (?, ?, ?);', 
                [racename, runner, prediction]
            );
        }
    );
}

function errorHandler(transaction, error) {
    alert('Oops. Error was '+error.message+' (Code '+error.code+')');
    return true;
}
        
		
function refreshEntries() {
	var racename = sessionStorage.racename;
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? ORDER BY prediction;', 
                [racename], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#enteredrunners').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#existingpredictions ul');
                        newEntryRow.find('.runner').text(row.runner);
                        newEntryRow.find('.prediction').text(row.prediction);
                    }
                }, 
                errorHandler
            );
        }
    );
}
