let localdev = false
if (window.location.protocol == 'file:'){
    console.log("LOCAL")
    localdev = true
}

function formatDateComparison(dateTimeString) {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
    });
    return formattedDate;
}

function formatTimeComparison(dateTimeString) {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    });
    return formattedDate;
}

// function formatDate(dateTimeString) {
//     const date = new Date(dateTimeString)
//     const formattedDate = date.toLocaleDateString()
//     return formattedDate
// }

function formatTimeFromComparison(dateTimeString) {
    const [hours, minutes] = dateTimeString.split(':');
    const dateObject = new Date();
    
    dateObject.setHours(parseInt(hours, 10));
    dateObject.setMinutes(parseInt(minutes, 10));
    
    const formattedDate = dateObject.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return formattedDate
}

function formatUnitCode(unitcode) {
    const unit = unitcode.substring(unitcode.lastIndexOf(':') + 1)
    return unit
}

function getTimeZoneName(offset) {
    switch(offset) {
        case "-05:00":
            timezone = "Eastern"
            break;
        case "-06:00":
            timezone = "Central"
            break;
        case "-07:00":
            timezone = "Mountain"
            break;
        case "-08:00":
            timezone = "Pacific"
            break;
        default:
          timezone = ""
    }
    return timezone
}