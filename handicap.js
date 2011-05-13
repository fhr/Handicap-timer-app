$(document).ready(function(){
    $('#newrace form').submit(saveRace);
}
);

function saveRace() {
    localStorage.date = $('#date').val();
    localStorage.distance = $('#distance').val();
    localStorage.racename = $('#racename').val();
    jQT.goTo('#existingrace');
    return false;
}


