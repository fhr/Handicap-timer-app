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

function deleteEntryById(id) {
    alert(id);
	db.transaction(
        function(transaction) {
            transaction.executeSql('DELETE FROM predictions WHERE id=?;', 
              [id], null, errorHandler);
        }
    );
}

function deleteRaceById(raceid) {
    alert(raceid);
	db.transaction(
        function(transaction) {
            transaction.executeSql('DELETE FROM races where id=?;', 
              [raceid], null, errorHandler);
        }
    );
	alert('deleted race');
}

function saveRace() {
    alert('starting saverace');
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


function setTitle() {
	$('#racename').val(localStorage.racename);
	document.getElementById('existingracetitle').innerHTML = document.getElementById('racename').value;
	document.getElementById('handicaptitle').innerHTML = document.getElementById('racename').value + ' predictions';
}



function errorHandler(transaction, error) {
    alert('Oops. Error was '+error.message+' (Code '+error.code+')');
    return true;
}
        
		
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
							deleteEntryById(clickedEntryId);
							clickedEntry.slideUp();
    });
                    }
                }, 
                errorHandler
            );
        }
    );
}

function showStarters() {
	var racename = document.getElementById('racename').value;
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
                        newEntryRow.find('.start').text(row.start);
						newEntryRow.find('.runner').text(row.runner);
                        newEntryRow.find('.prediction').text('('+row.prediction+')');
						newEntryRow.find('.delete').click(function(){
							var clickedEntry = $(this).parent();
							var clickedEntryId = clickedEntry.data('entryId');
							alert(clickedEntryId);
							deleteEntryById(clickedEntryId);
							clickedEntry.slideUp();
    });
                    }
                }, 
                errorHandler
            );
        }
    );
}

function calcHandicaps() {
	var racename = document.getElementById('racename').value;
	db.transaction(
        function(transaction) {
            transaction.executeSql('select max(prediction) from predictions where racename=?;', [racename],
                function(transaction, result) {
					localStorage.maxtime = 77;}
            )
			$('#maxtime').val(localStorage.maxtime);
			transaction.executeSql('update predictions set start=? where racename = ?;', [maxtime,racename]
            )       
        }
	);
}

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
							alert('test href'); // figure out how to reset current race var and add href here
							var clickedRace=$(this).parent();
						});
						newEntryRow.find('.delete').click(function(){
							var clickedRace = $(this).parent();
							var clickedRaceId = clickedRace.data('raceId');
							deleteRaceById(clickedRaceId);
							clickedRace.slideUp();
						});
                    }
                }, 
                errorHandler
            );
        }
    );
}

