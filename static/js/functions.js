let localdev = false
if (window.location.protocol == 'file:'){
    console.log("LOCAL")
    localdev = true
}

function getDailyHighs(forecasthourly) {
    let today = new Date()
    let lastdate = new Date(forecasthourly[forecasthourly.length - 1].startTime)

    today.setHours(0,0,0,0)
    lastdate.setHours(0,0,0,0)

    let timeDifference = lastdate.getTime() - today.getTime()
    let daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

    let dailyhighs = []
    for (let i = 0; i < daysDifference + 1; i++) {
        const newdate = new Date()
        dailyhighs[i] = [formatDateComparison(newdate.setDate(today.getDate() + i)),-999,0o0]
    }  

    forecasthourly.forEach((hourly) => {
        let forecastdate = formatDateComparison(hourly.startTime)
        for (let i = 0; i < daysDifference + 1; i++) {
            if (forecastdate == dailyhighs[i][0]) {
                if (hourly.temperature > dailyhighs[i][1]) { 
                    dailyhighs[i] = [forecastdate,hourly.temperature,formatTimeComparison(hourly.startTime)]
                }
            }
        } 
    });

    return dailyhighs
}

function getDailyLows(forecasthourly) {
    let today = new Date()
    let lastdate = new Date(forecasthourly[forecasthourly.length - 1].startTime)

    today.setHours(0,0,0,0)
    lastdate.setHours(0,0,0,0)

    let timeDifference = lastdate.getTime() - today.getTime()
    let daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24))

    let dailylows = []
    for (let i = 0; i < daysDifference + 1; i++) {
        const newdate = new Date()
        dailylows[i] = [formatDateComparison(newdate.setDate(today.getDate() + i)),999,0o0]
    }  

    forecasthourly.forEach((hourly) => {
        let forecastdate = formatDateComparison(hourly.startTime)
        for (let i = 0; i < daysDifference + 1; i++) {
            if (forecastdate == dailylows[i][0]) {
                if (hourly.temperature < dailylows[i][1]) { 
                    dailylows[i] = [forecastdate,hourly.temperature,formatTimeComparison(hourly.startTime)]
                }
            }
        } 
    });

    return dailylows
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

function formatDate(dateTimeString) {
    const date = new Date(dateTimeString)
    const formattedDate = date.toLocaleDateString()
    return formattedDate
}

function formatTimeFromComparison(dateTimeString) {
    const [hours, minutes] = dateTimeString.split(':');
    const dateObject = new Date();
    
    dateObject.setHours(parseInt(hours, 10));
    dateObject.setMinutes(parseInt(minutes, 10));
    
    const formattedDate = dateObject.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return formattedDate
}
function formatTime(dateTimeString) {
    const date = new Date(dateTimeString)
    const formattedDate = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
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