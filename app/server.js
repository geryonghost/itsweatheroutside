const express = require("express") // Used to display HTML pages
const bodyParser = require('body-parser'); // Used to handle HTML post
const { render } = require("ejs")
const axios = require('axios'); // Used to connect to remote APIs

const app_domain = "itsweatheroutside.com"
const app_email = "webmaster@itsweatheroutside.com"
const user_agent = "(" + app_domain + "," + app_email + ")"

const app = express();
const app_port = 3000;
const app_host = '0.0.0.0'

let clientlocale = ''

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(app_port, app_host, () => {
    console.log(`Server listening on port ${app_port}`)
})

// Default view of the site
app.get('/', async (req, res) => {
    const acceptlanguageheader = req.get('Accept-Language')
    const preferredlocales = parseAcceptLanguageHeader(acceptlanguageheader)
    clientlocale = preferredlocales[0] || 'en-US'
    
    const query = req.query.q;

    if (query == "" || query == undefined) {
        res.render('index', {})
    } else {
        try {
            forecast = await getWeather(query, clientlocale);
            // console.log(forecast)
            res.render('index', {forecast});
        } catch (error) {
            console.error(error)
            res.status(500).json({ success: false, error: error.message });
        }  
    }
})


// Get the weather forecast from the searchquery
async function getWeather(query) {
    query = query.replace(/\s+/g, ' ')              // Replace multiple spaces with a single space
    query = query.trim();                           // Remove whitespace at both ends
    query = query.toLowerCase();                    // Convert to lower case
    query = query.replace('.','').replace(',','');  // Replace . with nothing and , with nothing
    query = query.replace('lane','ln');             // Replace lane with ln

    let now, weather_forecast

    // Get the latitude and longitude from Nominatim
    if (query != "") {
        console.log("Getting latitude and longitude")
        try {
            const mapdata_results = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    'format': 'json',
                    'accept-language': 'en',
                    'countrycodes':'us',
                    'limit':1,
                    'email':app_email
                }
            })

            if (mapdata_results.status == 200) {
                mapdata = await mapdata_results.data;
                
                lat = mapdata[0].lat
                lon = mapdata[0].lon
                addresstype = mapdata[0].addresstype
                addressname = mapdata[0].name
                
                console.log(lat + ',' + lon)
                console.log(addresstype + ', ' + addressname)
            } else {
                console.log("Query results in bad response status")
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

        console.log("Getting Forecast URL")
        try {
            const results = await axios.get(weather_forecast_api + lat + ',' + lon, { headers: { user_agent } })
            if (results.status == 200) {
                forecasturl = await results.data.properties.forecastGridData
            } else {
                console.log("Query results in bad response status")
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
            forecastdaily_results = await axios.get(forecasturl + '/forecast', { headers: { user_agent } })
        
            console.log("Requesting Hourly Forecast")
            forecasthourly_results = await axios.get(forecasturl + '/forecast/hourly', { headers: { user_agent } })
        
            console.log("Requesting Grid Raw Forecast")
            forecastgriddata_results = await axios.get(forecasturl, { headers: { user_agent } })
        
            console.log("Requesting Alerts")
            forecastalerts_results = await axios.get(weather_alerts_api + location, { headers: { user_agent } })
        } catch (error) {
            console.error('Error fetching weather data:', error)
        }
    }

    if (forecastdaily_results != undefined && forecasthourly_results != undefined && forecastalerts_results != undefined && forecastgriddata_results != undefined) {
        forecastdaily = await forecastdaily_results.data.properties.periods
        // console.log("Forecast Daily")
        // console.log(forecastdaily)
        
        forecasthourly = await forecasthourly_results.data.properties.periods
        // console.log("Forecast Hourly")
        // console.log(forecasthourly)
        
        forecastalerts = await forecastalerts_results.data.features
        // console.log("Forecast Alerts")
        // console.log(forecastalerts)

        forecastgriddata = await forecastgriddata_results.data.properties
        // console.log("Forecast Grid")
        // console.log(forecastgriddata)

        timezone = getTimeZoneName(forecastdaily[0].startTime.substring(forecastdaily[0].startTime.length - 6))
        elevation = Math.round(forecastgriddata.elevation.value) + formatUnitCode(forecastgriddata.elevation.unitCode)
    }
    
    // Display the current forecast in HTML
    const currentforecast = currentForecast(forecasthourly)
    const hourlyforecast = hourlyForecast(forecasthourly)
    const dailyforecast = dailyForecast(forecastdaily)
    // hourlyForecast(forecasthourly)
    // dailyForecast(forecasthourly, forecastdaily)
// console.log(currentforecast)

    now = new Date().toISOString()
    try {
        const document = {
            "forecastfrom": now,
            "query": query,
            "lat": lat,
            "lon": lon,
            "addresstype": addresstype,
            "addressname": addressname,
            "forecasturl": forecasturl,
            "timezone": timezone[1],
            "elevation": elevation
        }


        // addressname, timezone, elevation, currentforecast
        const forecastcurrent_json = {"forecastcurrent" : currentforecast}
        const forecasthourly_json = {"forecasthourly" : hourlyforecast}
        const forecastdaily_json = {"forecastdaily" : dailyforecast}
        // let forecastalerts_json = {"forecastalerts" : forecastalerts_results.data.features};
        // let forecastgriddata_json = {"griddata" : forecastgriddata_results.data.properties};
    
        // const db_data = { ...document, ...currentforecast, ...forecasthourly_json, ...forecastalerts_json, ...forecastgriddata_json };
        const db_data = { ...document, ...forecastcurrent_json, ...forecasthourly_json, ...forecastdaily_json }
        // const db_data = { ...document, ...forecastcurrent_json}

        weather_forecast = db_data;

    } catch (err) {
        console.error(err);
    }

    return weather_forecast;
}

// Forecast functions
function currentForecast(forecasthourly) {
    let temperaturesum = temperatureaverage = 0
    
    const dailyhigh = getDailyHighs(forecasthourly)
    const dailylow = getDailyLows(forecasthourly)
    
    // Determines the temperature trend based in the average for the next 10 hours
    for (let i = 0; i < 10; i++) {
        temperaturesum += forecasthourly[i].temperature
    }
    temperatureaverage = temperaturesum / 10
    
    if (forecasthourly[0].temperature > temperatureaverage) { 
        currenttemperaturetrend = "<span style=\"color:blue;\">&#8595;</span>"
    } else if (forecasthourly[0].temperature < temperatureaverage) { 
        currenttemperaturetrend = "<span style=\"color:green\";>&#8593;</span>"
    }

    const i = 0
    const currentforecast = {
        "startdate": formatDate(forecasthourly[i].startTime),
        "starttime": formatTime(forecasthourly[i].startTime),
        "dewpoint": forecasthourly[i].dewpoint.value.toFixed(2),
        "dewpointunit": formatUnitCode(forecasthourly[i].dewpoint.unitCode),
        "humidity": forecasthourly[i].relativeHumidity.value,
        "humidityunit": formatUnitCode(forecasthourly[i].relativeHumidity.unitCode),
        "hightemp": dailyhigh[0][1],
        "lowtemp": dailylow[0][1],
        "hightime": formatTimeFromComparison(dailyhigh[0][2]),
        "lowtime": formatTimeFromComparison(dailylow[0][2]),
        "icon": forecasthourly[i].icon.replace(",0?size=small","?size=medium"),
        "isdaytime": forecasthourly[i].isDaytime,
        "probabilityofprecipitation": forecasthourly[i].probabilityOfPrecipitation.value,
        "probabilityofprecipitationunit": formatUnitCode(forecasthourly[i].probabilityOfPrecipitation.unitCode),
        "shortforecast": forecasthourly[i].shortForecast,
        "temperature": forecasthourly[i].temperature,
        "temperatureunit": forecasthourly[i].temperatureUnit,
        "temperaturetrend": currenttemperaturetrend,
        "winddirection": forecasthourly[i].windDirection,
        "windspeed": forecasthourly[i].windSpeed
    }

    return currentforecast
}

function hourlyForecast(forecasthourly) {
    let hourlyforecast = []

    for (let i = 0; i < forecasthourly.length; i++) {
        hourlyforecast[i] = {
            "startdate": formatDate(forecasthourly[i].startTime),
            "starttime": formatTime(forecasthourly[i].startTime),
            "starttime2": forecasthourly[i].startTime,
            "dewpoint": forecasthourly[i].dewpoint.value.toFixed(2),
            "dewpointunit": formatUnitCode(forecasthourly[i].dewpoint.unitCode),
            "humidity": forecasthourly[i].relativeHumidity.value,
            "humidityunit": formatUnitCode(forecasthourly[i].relativeHumidity.unitCode),
            // "hightemp": dailyhigh[0][1],
            // "lowtemp": dailylow[0][1],
            // "hightime": formatTimeFromComparison(dailyhigh[0][2]),
            // "lowtime": formatTimeFromComparison(dailylow[0][2]),
            "icon": forecasthourly[i].icon.replace(",0?size=small","?size=medium"),
            "isdaytime": forecasthourly[i].isDaytime,
            "probabilityofprecipitation": forecasthourly[i].probabilityOfPrecipitation.value,
            "probabilityofprecipitationunit": formatUnitCode(forecasthourly[i].probabilityOfPrecipitation.unitCode),
            "shortforecast": forecasthourly[i].shortForecast,
            "temperature": forecasthourly[i].temperature,
            "temperatureunit": forecasthourly[i].temperatureUnit,
            // "temperaturetrend": currenttemperaturetrend,
            "winddirection": forecasthourly[i].windDirection,
            "windspeed": forecasthourly[i].windSpeed
        }
    }

    return hourlyforecast
}

function dailyForecast(forecastdaily) {
    let dailyforecast = []

    for (let i = 0; i < forecastdaily.length; i++) {
        dailyforecast[i] = {
            "startime": formatTime(forecastdaily[i].startTime),
            "endtime": formatTime(forecastdaily[i].endTime),
            "startdate": formatDate(forecastdaily[i].startTime),
            "enddate": formatDate(forecastdaily[i].endTime),
            "detailedforecast": forecastdaily[i].detailedForecast,
            "dewpoint": forecastdaily[i].dewpoint.value.toFixed(2),
            "dewpointunit": formatUnitCode(forecastdaily[i].dewpoint.unitCode),
            "humidity": forecastdaily[i].relativeHumidity.value,
            "humidityunit": formatUnitCode(forecastdaily[i].relativeHumidity.unitCode),
            "name": forecastdaily[i].name,
            "icon": forecastdaily[i].icon.replace(",0?size=small","?size=medium"),
            "isDaytime": forecastdaily.isDaytime,
            "probabilityofprecipitation": forecastdaily[i].probabilityOfPrecipitation.value,
            "probabilityofprecipitationunit": formatUnitCode(forecastdaily[i].probabilityOfPrecipitation.unitCode),
            "shortforecast": forecastdaily[i].shortForecast,
            "temperature": forecastdaily[i].temperature,
            "temperatureunit": forecastdaily[i].temperatureUnit,
            // "temperaturetrend": currenttemperaturetrend,
            "winddirection": forecastdaily[i].windDirection,
            "windspeed": forecastdaily[i].windSpeed
        }
    }

    return dailyforecast
}

// Forecast Helper Functions
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
    })
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
                    // dailylows[i] = [forecastdate,hourly.temperature,(hourly.startTime)]
                }
            }
        } 
    })
    return dailylows
}

// Content functions
function convertCelsiusToFahrenheit(celsius) {
    const fahrenheit = (celsius * 9/5) + 32;
    return fahrenheit;
  }
  
  function convertfahrenheitToCelsius(fahrenheit) {
    const celsius = (fahrenheit - 32) * 5/9;
    return celsius;
  }

function formatDate(dateTimeString) {
    const date = new Date(dateTimeString)
    const formattedDate = date.toLocaleDateString(clientlocale)
    return formattedDate
}

function formatDateComparison(dateTimeString) {
    const date = new Date(dateTimeString);
    const formattedDate = date.toLocaleString(clientlocale, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
    });
    return formattedDate;
}

function formatTime(dateTimeString) {
    const date = new Date(dateTimeString)
    const options = {
        timeZone: getTimeZoneName(dateTimeString.substring(dateTimeString.length - 6))[0],
        hour: 'numeric', 
        minute: '2-digit'
    }

    // const options = { timeZone: 'America/New_York' };
    // const timeString = currentDate.toLocaleTimeString('en-US', options);
    


    const formattedDate = date.toLocaleTimeString(clientlocale, options)
    // { 
        // hour: 'numeric', 
        // minute: '2-digit' 
    // })
    return formattedDate
}

function formatTimeComparison(dateTimeString) {
    const date = new Date(dateTimeString)
    const formattedDate = date.toLocaleString(clientlocale, {
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
    })
    return formattedDate;
}

function formatTimeFromComparison(dateTimeString) {
    const [hours, minutes] = dateTimeString.split(':')
    const dateObject = new Date()
    
    dateObject.setHours(parseInt(hours, 10))
    dateObject.setMinutes(parseInt(minutes, 10))
    
    const formattedDate = dateObject.toLocaleTimeString(clientlocale, { 
        hour: 'numeric', 
        minute: '2-digit' 
    })
    return formattedDate
}

function formatUnitCode(unitcode) {
    let unit = unitcode.substring(unitcode.lastIndexOf(':') + 1)

    if (unit == "degC") { unit = "C" }
    if (unit == "percent") { unit = "%"}

    return unit
}

function getTimeZoneName(offset) {
    let timezone = []
    switch(offset) {
        case "-05:00":
            timezone[0] = "America/New_York"
            timezone[1] = "Eastern"
            break;
        case "-06:00":
            timezone[0] = "America/Chicago"
            timezone[1] = "Central"
            break;
        case "-07:00":
            timezone[0] = "America/Denver"
            timezone[1] = "Mountain"
            break;
        case "-08:00":
            timezone[0] = "America/Los_Angeles"
            timezone[1] = "Pacific"
            break;
        case "-09:00":
            timezone[0] = "America/Anchorage"
            timezone[1] = "Alaska"
        case "-10:00":
            timezone[0] = "Pacific/Honolulu"
            timezone[1] = "Hawaii"
        default:
            timezone[0] = ""
            timezone[1] = ""
    }
    return timezone
}

function parseAcceptLanguageHeader(header) {
    if (!header) {
      return [];
    }
  
    return header
      .split(',')
      .map((language) => {
        const [locale, q] = language.trim().split(';q=');
        return {
          locale,
          quality: q ? parseFloat(q) : 1,
        };
      })
      .sort((a, b) => b.quality - a.quality)
      .map((entry) => entry.locale);
  }

