// initialise all important functions
	$(document).ready(function(){
    $('#newrace form').submit(saveRace);
	$('#newrace form').submit(setTitle);
	$('#enterhandicaps form').submit(savePrediction);
	$('#enterhandicaps form').submit(refreshEntries);
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
                'CREATE TABLE IF NOT EXISTS predictions (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, runner TEXT NOT NULL, prediction INTEGER, start TEXT, finish TEXT, position TEXT);'
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
	var sqlString='DELETE FROM '+table+' WHERE id='+id+';'
	db.transaction(
        function(transaction) {
            transaction.executeSql(sqlString, 
              [], null, errorHandler);
        }
    );
}

// save race form into database
function saveRace() {
    localStorage.racename = $('#racename').val();
	var date = null;
    var distance = null;
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
	// empty form
	$('#runner').val("");
	$('#prediction').val("");
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
							deleteById('predictions',clickedEntryId);
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
	$('#finallist li:gt(1)').remove();
	// create list of start times
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT DISTINCT(start) FROM predictions WHERE racename = ? order by prediction desc;', 
                [racename], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#timeheader').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.appendTo('#finallist');
                        newEntryRow.find('.start').text(row.start+' min  ');
						newEntryRow.attr('id',row.start);
					}
                }, 
                errorHandler
            );
        }
    );
	// add in runners per start time
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? order by prediction desc;', 
                [racename], 
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#runnername').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
						var listid='#'+row.start;
                        newEntryRow.appendTo(listid);
                        newEntryRow.find('.runnertext').text(row.runner);
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
	$('#existingracesfordelete li:gt(0)').remove();
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
						var newEntryRowB = $('#racelisttemplatefordelete').clone();
                        newEntryRowB.removeAttr('id');
                        newEntryRowB.removeAttr('style');
                        newEntryRowB.data('raceId', row.id);
                        newEntryRowB.appendTo('#existingracesfordelete');
                        newEntryRowB.find('.oldrace').text(row.racename);
						newEntryRowB.find('.delete').click(function(){
							var clickedRace = $(this).parent();
							var clickedRaceId = clickedRace.data('raceId');
							var table='races';
							deleteById(table,clickedRaceId);
							clickedRace.slideUp();}
							);
                    if (i==result.rows.length-1) {
						var deleterow=$('#racelisttemplate').clone();
						deleterow.removeAttr('id');
						deleterow.removeAttr('style');
						deleterow.removeAttr('class');
						deleterow.find('.oldrace').text('Delete races');
						deleterow.appendTo('#existingraces');
						deleterow.attr('id','deleteraces');
						deleterow.attr('class','delete');
						deleterow.find('.oldrace').click(function(){
							jQT.goTo('#deleteraces');
						});
							};
					}
                }, 
                errorHandler
            );
        }
    );
	
}

                    
// pull list of all existing runners, to serve handicap entry autocomplete
function getRunners() {
	localStorage.runnerlist="";
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT distinct runner FROM predictions;', [],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						var name=row.runner+",";
						localStorage.runnerlist=localStorage.runnerlist+name;
						$("#runner").autocomplete(localStorage.runnerlist.split(","));
						};
                    },
                errorHandler
			);
		}
	);
}

function createFinishPage(){
	// create enough rows on page to select finisher for every position
	var runner_count=localStorage.runnerCount;
	$('#finisherlist li:gt(0)').remove();
	for (var i=0; i < runner_count; i++) {
	var newEntryRow = $('#finishtemplate').clone();
    newEntryRow.removeAttr('id');
	newEntryRow.attr('id','p'+(i+1));
        newEntryRow.removeAttr('style');
        newEntryRow.appendTo('#finisherlist');
        newEntryRow.find('.finishingposition').text(i+1);
		newEntryRow.data('positionId', i+1);//give a 'positionId' that can be used later to retrieve values
		};
	document.getElementById('startercount').innerHTML = 'This race had '+runner_count+' starters.';
}

// enter finish order
function finalRaceList() {
	var racename = localStorage.racename;
	// create list of runners from this race to use for dropdown
	var thisRunnerList=new Array();
	$('.finisherchoice option:gt(0)').remove();
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT distinct runner FROM predictions where racename=? order by runner;', [racename],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						var name=row.runner;
						thisRunnerList[i]=name;
						$('<option />', {value: i, text: name}).appendTo('.finisherchoice');
						localStorage.runnerCount=thisRunnerList.length;
						if (i==result.rows.length-1) {
							createFinishPage();
							};
						};
                    },
                errorHandler
			);
		}
	);
}
	
// save selected finish order into database
function saveFinishOrder(elem) {
var runner=$(elem).find(':selected').text();
var position=$(elem).parent().attr('id').substring(1);
var racename = localStorage.racename;
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'update predictions set position=? where runner=? and racename = ?;', [position,runner,racename],
                function (transaction, result) {},
                errorHandler
			);
		}
	);
}

