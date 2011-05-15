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
                'CREATE TABLE IF NOT EXISTS predictions (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, runner TEXT NOT NULL, prediction INTEGER NOT NULL, start INTEGER NOT NULL );'
            );
        }
    );
}
);

function deleteEntryById(id) {
    db.transaction(
        function(transaction) {
            transaction.executeSql('DELETE FROM predictions WHERE id=?;', 
              [id], null, errorHandler);
        }
    );
}

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
                        var newEntryRow = $('#template').clone();
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

function savePrediction() {
	var racename = document.getElementById('racename').value;
    var runner = $('#runner').val();
    var prediction = $('#prediction').val();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'INSERT INTO predictions (racename, runner, prediction,start) VALUES (?, ?, ?,0);', 
                [racename, runner, prediction]
            );
        }
    );
	refreshEntries();
}

function showStarters() {
	var racename = document.getElementById('racename').value;
	$('#finallist li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? order by prediction;', 
                [racename], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#template').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#finallist');
                        newEntryRow.find('.start').text(row.start);
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

