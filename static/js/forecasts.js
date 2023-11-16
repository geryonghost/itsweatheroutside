// Get the weather forecast from the searchquery
async function getWeather(query) {
    query = query.replace(/\s+/g, ' ') //Replace multiple spaces with a single space
    query = query.trim();
    query = query.toLowerCase();
    query = query.replace('.','').replace(',','');
    query = query.replace('lane','ln');

    let lat, lon, addresstype, addressname
    let forecasturl, weather_forecast_api, weather_alerts_api, location
    let forecastdaily_results, forecasthourly_results, forecastgriddata_results, forecastalerts_results
    let timezone

    // Get the latitude and longitude from Nominatim
    if (query != "") {
        console.log("Getting latitude and longitude")
        try {
            const mapdata_querystring = "q=" + query + "&format=jsonv2&accept-language=en&countrycodes=us&limit=1&email=skyyweatherapp@comtily.com"
            const mapdata_results = await fetch("https://nominatim.openstreetmap.org/search?" + mapdata_querystring, {
                method: "get",
                mode: "cors",
            })
            if (mapdata_results.status == 200) {
                mapdata = await mapdata_results.json()
                
                lat = mapdata[0].lat
                lon = mapdata[0].lon
                addresstype = mapdata[0].addresstype
                addressname = mapdata[0].name
                
                console.log(lat + ',' + lon)
                console.log(addresstype + ', ' + addressname)
            }

        } catch (error) {
            console.log("Unable to reach the service. Query:" + query)
            console.error(error)
        }
    } else {
        console.error("No query was submitted")
    }

    if (lat != "" && lon != "") {
        // Get weather api urls
        weather_forecast_api = 'https://api.weather.gov/points/'
        weather_alerts_api = 'https://api.weather.gov/alerts/active/?point='  
        location = lat + ',' + lon;

        console.log("Getting Forecast URL");
        try {
            const results = await fetch(weather_forecast_api + location)
            if (results.status == 200) {
                results_json = await results.json()
                if (results_json.properties.forecastGridData != null) {
                    forecasturl = results_json.properties.forecastGridData
                    // console.log(forecasturl)
                } else {
                    console.log("Error missing forecast URL")
                }
            }
        } catch (err) {
            console.error('Error fetching forecast URL', err)
        }
    } else {
        console.error("Latitude and/or Longitude were not acquired")
    }

    if (forecasturl != "" && forecasturl != undefined) {
        // Get the weather forecasts
        try {
            console.log("Requesting Daily Forecast")
            forecastdaily_results = await fetch(forecasturl + '/forecast')
        
            console.log("Requesting Hourly Forecast")
            forecasthourly_results = await fetch(forecasturl + '/forecast/hourly')
        
            console.log("Requesting Grid Raw Forecast")
            forecastgriddata_results = await fetch(forecasturl)
        
            console.log("Requesting Alerts")
            forecastalerts_results = await fetch(weather_alerts_api + location)
        } catch (error) {
            console.error('Error fetching weather data:', error)
        }
    }

    if (forecastdaily_results != undefined && forecasthourly_results != undefined && forecastalerts_results != undefined && forecastgriddata_results != undefined) {
        forecastdaily = await forecastdaily_results.json()
        forecastdaily = forecastdaily.properties.periods
        if (localdev == true) { console.log(forecastdaily) }

        forecasthourly = await forecasthourly_results.json()
        forecasthourly = forecasthourly.properties.periods
        if (localdev == true) { console.log(forecasthourly) }
        
        forecastalerts = await forecastalerts_results.json()
        forecastalerts = forecastalerts.features
        if (localdev == true) { console.log(forecastalerts) }

        forecastgriddata = await forecastgriddata_results.json()
        forecastgriddata = forecastgriddata.properties
        if (localdev == true) { console.log(forecastgriddata) }

        timezone = getTimeZoneName(forecastdaily[0].startTime.substring(forecastdaily[0].startTime.length - 6))
        elevation = Math.round(forecastgriddata.elevation.value) + formatUnitCode(forecastgriddata.elevation.unitCode)
    }
    
    // Display the current forecast in HTML
    currentForecast(addressname, timezone, elevation, forecasthourly)
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

function currentForecast(addressname, timezone, elevation, forecasthourly) {
    let temperaturesum = temperatureaverage = 0
    let dailyhigh = getDailyHighs(forecasthourly)
    let dailylow = getDailyLows(forecasthourly)

    const searchhints = document.getElementById("searchhints")
    const currentforecast = document.getElementById("currentforecast")
    const currenticon = document.getElementById("currenticon")
    const currenttemperature = document.getElementById("currenttemperature")
    const currenthightemp = document.getElementById("currenthightemp")
    const currentlowtemp = document.getElementById("currentlowtemp")
    const currenthightime = document.getElementById("currenthightime")
    const currentlowtime = document.getElementById("currentlowtime")
    const currentshortdescription = document.getElementById("currentshortdescription")
    const currentaddressname = document.getElementById("currentaddressname")
    const currenttimezone = document.getElementById("currenttimezone")
    const currentelevation = document.getElementById("currentelevation")

    // Determines the temperature trend based in the average for the next 10 hours
    for (let i = 0; i < 10; i++) {
        temperaturesum += forecasthourly[i].temperature
    }
    temperatureaverage = temperaturesum / 10
    
    if (forecasthourly[0].temperature > temperatureaverage) { 
        currenttemperature.innerHTML = forecasthourly[0].temperature + "&#176; <span style=\"color:blue;\">&#8595;</span>"
    } else if (forecasthourly[0].temperature < temperatureaverage) { 
        currenttemperature.innerHTML = forecasthourly[0].temperature + "&#176; <span style=\"color:green\";>&#8593;</span>"
    } else {
        currenttemperature.innerHTML = forecasthourly[0].temperature
    }

    currenticon.src = forecasthourly[0].icon.replace(",0?size=small","?size=medium")
    currenthightemp.innerHTML = dailyhigh[0][1]
    currentlowtemp.innerHTML = dailylow[0][1]
    currenthightime.innerHTML = formatTimeFromComparison(dailyhigh[0][2])
    currentlowtime.innerHTML = formatTimeFromComparison(dailylow[0][2])
    currentshortdescription.innerHTML = forecasthourly[0].shortForecast
    currentaddressname.innerHTML = addressname
    currenttimezone.innerHTML = timezone
    currentelevation.innerHTML = elevation

    searchhints.style.display="none"
    searchhints.style.visibility="hidden"
    currentforecast.style.display="block"
    currentforecast.style.visibility="visible"
}