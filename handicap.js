// initialise all important functions
	$(document).ready(function(){
    $('#newrace form').submit(saveRace);
	$('#newrace form').submit(setTitle);
	$('#enterhandicaps form').submit(savePrediction);
	$('#enterhandicaps form').submit(refreshEntries);
	$('#calcraces').click(raceList);
	// create database to hold data on predicted and actual times
    db = openDatabase('Handicaps', '1.0', 'Handicaps', 65536);
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS predictions (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, runner TEXT NOT NULL, prediction INTEGER, start TEXT, finish TEXT, position TEXT);'
			);
			transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS races (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,racename TEXT NOT NULL, date TEXT, distance REAL);'
			);
			transaction.executeSql(
                'CREATE TABLE IF NOT EXISTS autocompletion (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,runner TEXT NOT NULL, value TEXT,racename TEXT NOT NULL);'
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
	var racename = localStorage.racename;
    var runner = $('#runner').val();
    var prediction = $('#prediction').val();
	if (runner=="") {
		alert('No runner name! Please give this person a name.');
		} else {
			if (prediction=="") {alert('No time prediction! Please add a time.');} else {
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
			}};
}

// set page title to current race name
function setTitle() {
	$('.info').html('Managing race: '+localStorage.racename);
}

// handles SQL errors
function errorHandler(transaction, error) {
    alert('Oops. Error was '+error.message+' (Code '+error.code+')');
    return true;
}
        
// update handicap entry page to show entries so far
function refreshEntries() {
	var racename = localStorage.racename;
	$('#enteredrunners li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? order by runner;', 
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
                        newEntryRow.find('.prediction').text('('+row.prediction+' min)');
						newEntryRow.find('.delete').click(function(){
							var clickedEntry = $(this).parent();
							var clickedEntryId = clickedEntry.data('entryId');
							deleteById('predictions',clickedEntryId);
							clickedEntry.slideUp();
					
    });
		if (i==result.rows.length-1){calcHandicaps();};
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
				'INSERT INTO races (racename, date, distance) VALUES (?, ?, ?);', 
                [racename, date, distance], 
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
	var racename = localStorage.racename;
	calcHandicaps();
	$('#finallist h2:gt(0)').remove();
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
	$('#deleteracesbutton').remove();
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
						$('<ul class="individual" id="deleteracesbutton"><li onClick="jQT.goTo(\'#deleteraces\')">Delete races</li></ul>').appendTo('#selectrace');
						};
							};
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
						$("#runner").autocomplete({source:localStorage.runnerlist.split(',')});
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
	refreshFinishPage();
	}

// enter finish order
function finalRaceList() {
	var racename = localStorage.racename;
	// create list of runners from this race to use for dropdown
	var thisRunnerList=new Array();
	var racename=localStorage.racename;
	$('.finisherchoice option:gt(0)').remove();
	db.transaction(
		function(transaction) {
			transaction.executeSql (
				'delete from autocompletion;'
			);
		}
	);
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions where racename=? order by runner;', [racename],
                function (transaction, result) {
                    for (var i=0; i < result.rows.length; i++) {
						var row = result.rows.item(i);
						var name=row.runner;
						var value=row.id;
						thisRunnerList[i]=name;
						$('<option />', {value: row.id, text: name}).appendTo('.finisherchoice');
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
var value=$(elem).find(':selected').val();
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

// update entries on DNF page
function DNFupdate() {
	var racename=localStorage.racename;
	$('#dnflist li:gt(0)').remove();
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? and position isnull order by runner;', 
                [racename], 
                function (transaction, result) {
					if (result.rows.length==0){alert('No DNFs!');
					jQT.goTo('#viewresults');} else {
                    for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
                        var newEntryRow = $('#dnftemplate').clone();
                        newEntryRow.removeAttr('id');
                        newEntryRow.removeAttr('style');
                        newEntryRow.data('entryId', row.id);
                        newEntryRow.appendTo('#dnflist');
                        newEntryRow.find('.runner').text(row.runner);
						if (i==result.rows.length-1) {
						jQT.goTo('#dnfpage');};
						};
                    }}, 
                errorHandler
            );
        }
    );
	
}

function fixFinishPage(){
	var racename=localStorage.racename;
    db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? and position is not null order by runner;', 
                [racename], 
                function (transaction, result) {
					if (result.rows.length==0){
					alert('no positions selected yet! starting fresh');
					createFinishPage();};
					},
                errorHandler
            );
        }
    );
}

function refreshFinishPage() {
	var racename=localStorage.racename;
	db.transaction(
        function(transaction) {
            transaction.executeSql(
                'SELECT * FROM predictions WHERE racename = ? and position is not null order by runner;', 
                [racename], 
                function (transaction, result) {
					if (result.rows.length==0){alert('no positions selected yet! starting fresh');};
					// function here to find and select finishing positions correctly
					for (var i=0; i < result.rows.length; i++) {
                        var row = result.rows.item(i);
						var pos = row.position;
						var id_val= row.id;
						var selectid='#p'+pos+' select option[value=\''+id_val+'\']';
						$(selectid).attr("selected","selected");
						}; 
					},
                errorHandler
            );
        }
    );
}