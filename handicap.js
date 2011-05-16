// initialise all important functions
$(document).ready(function(){
    $('#newrace form').submit(saveRace);
	$('#newrace form').submit(setTitle);
	$('#enterhandicaps form').submit(savePrediction);
	$('#calcraces').click(raceList);
	// create database to hold data on predicted and actual times
	var shortName = 'Handicaps';
    var version = '1.0';
    var displayName = 'Handicaps';
    var maxSize = 65536;
    db = openDatabase(shortName, version, displayName, maxSize);
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS predictions (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, runner TEXT NOT NULL, prediction INTEGER, start INTEGER);'
			);
			transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS races (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, date TEXT, distance REAL);'
			);
        }
    );
}
);

// delete a race or person entry from DB
function deleteById(table,id) {
	db.transaction(
        function(transaction) {
            transaction.executeSql('DELETE FROM ? WHERE id=?;', 
              [table,id], null, errorHandler);
        }
    );
}

// save race form into database
function saveRace() {
	localStorage.date = $('#date').val();
    localStorage.distance = $('#distance').val();
    localStorage.racename = $('#racename').val();
	var date = $('#date').val();
    var distance = $('#distance').val();
    var racename = $('#racename').val();
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO races (racename, date, distance) VALUES (?, ?, ?);', 
                [racename, date, distance]
            );
        }
    );
    jQT.goTo('#existingrace');
    return false;
}

// save an individual time prediction
function savePrediction() {
	var racename = document.getElementById('racename').value;
    var runner = $('#runner').val();
    var prediction = $('#prediction').val();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO predictions (racename, runner, prediction, start) VALUES (?, ?, ?,?);', 
                [racename, runner, prediction,0]
            );
        }
    );
	refreshEntries();
}

// set page title to current race name
function setTitle() {
	$('#racename').val(localStorage.racename);
	document.getElementById('existingracetitle').innerHTML = document.getElementById('racename').value;
	document.getElementById('handicaptitle').innerHTML = document.getElementById('racename').value + ' predictions';
}

// handles SQL errors
function errorHandler(transaction, error) {
    alert('Oops. Error was '+error.message+' (Code '+error.code+')');
    return true;
}
        
// update handicap entry page to show entries so far
function refreshEntries() {
	var racename = document.getElementById('racename').value;
	$('#enteredrunners li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? order by prediction;', 
                [racename], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#predictiontemplate').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#enteredrunners');
                        newEntryRow.find('.runner').text(row.runner);
                        newEntryRow.find('.prediction').text(row.prediction);
						newEntryRow.find('.delete').click(function(){
							var clickedEntry = $(this).parent();
							var clickedEntryId = clickedEntry.data('entryId');
							deleteById(predictions,clickedEntryId);
							clickedEntry.slideUp();
    });
                    }
                }, 
                errorHandler
            );
        }
    );
}

// calculate handicaps for a race once all expected times are entered
function calcHandicaps() {
	var racename = localStorage.racename;
	db.transaction(
        function(transaction) {
            transaction.executeSql(
				'SELECT * FROM predictions WHERE racename=? order by prediction desc;', 
				[racename],
                function(transaction, result) {
				localStorage.maxtime=result.rows.item(0)['prediction'];
				},
				errorHandler
			);
        }      
        
	);
	db.transaction(
        function(transaction) {
            transaction.executeSql(
				'update predictions set start=?-prediction where racename = ?;', 
				[localStorage.maxtime,racename],
                function(transaction, result) {
				},
				errorHandler
			);
        }      
        
	);
}

// show start list in nice format
function showStarters() {
	var racename = document.getElementById('racename').value;
	calcHandicaps();
	$('#finallist li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? order by prediction desc;', 
                [racename], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#startlisttemplate').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#finallist');
                        newEntryRow.find('.start').text(row.start+' min  ');
						newEntryRow.find('.runner').text(row.runner);
					}
                }, 
                errorHandler
            );
        }
    );
}

// show list of races 
function raceList() {
	$('#existingraces li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM races order by racename;', [],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#racelisttemplate').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('raceId', row.id);
                        newEntryRow.appendTo('#existingraces');
                        newEntryRow.find('.oldrace').text(row.racename);
						newEntryRow.find('.oldrace').click(function(){
							var clickedRace=$(this).text();
							localStorage.racename = clickedRace;
							setTitle();
							jQT.goTo('#existingrace');
						});
						newEntryRow.find('.delete').click(function(){
							var clickedRace = $(this).parent();
							var clickedRaceId = clickedRace.data('raceId');
							var table='races';
							deleteById(table,clickedRaceId);
							clickedRace.slideUp();
						});
                    }
                }, 
                errorHandler
            );
        }
    );
}


