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
        if (localdev == true) { console.log("Getting latitude and longitude") }
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
                
                if (localdev == true) { console.log(lat + ',' + lon) }
                if (localdev == true) { console.log(addresstype + ', ' + addressname) }
            } else {
                const searcherror = document.getElementById("searcherror")
                searcherror.innerHTML = "Unable to get location, please refresh the page"
                searcherror.style.visibility = "Visible"
                searcherror.style.display = "Block"
            }

        } catch (error) {
            if (localdev == true) { console.log("Unable to reach the service. Query:" + query) }
            console.error(error)

            const searcherror = document.getElementById("searcherror")
            searcherror.innerHTML = "Unable to get location, please try a new search"
            searcherror.style.visibility = "Visible"
            searcherror.style.display = "Block"
            return
        }
    } else {
        console.error("No query was submitted")
    }

    if (lat != "" && lon != "") {
        // Get weather api urls
        weather_forecast_api = 'https://api.weather.gov/points/'
        weather_alerts_api = 'https://api.weather.gov/alerts/active/?point='  
        location = lat + ',' + lon;

        if (localdev == true) { console.log("Getting Forecast URL") }
        try {
            const results = await fetch(weather_forecast_api + location)
            if (results.status == 200) {
                results_json = await results.json()
                if (results_json.properties.forecastGridData != null) {
                    forecasturl = results_json.properties.forecastGridData
                    // console.log(forecasturl)
                } else {
                    if (localdev == true) { console.log("Error missing forecast URL") }
                }
            } else {
                const searcherror = document.getElementById("searcherror")
                searcherror.innerHTML = "Unable to get forecast, please refresh the page"
                searcherror.style.visibility = "Visible"
                searcherror.style.display = "Block"
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
            if (localdev == true) { console.log("Requesting Daily Forecast") }
            forecastdaily_results = await fetch(forecasturl + '/forecast')
        
            if (localdev == true) { console.log("Requesting Hourly Forecast") }
            forecasthourly_results = await fetch(forecasturl + '/forecast/hourly')
        
            if (localdev == true) { console.log("Requesting Grid Raw Forecast") }
            forecastgriddata_results = await fetch(forecasturl)
        
            if (localdev == true) { console.log("Requesting Alerts") }
            forecastalerts_results = await fetch(weather_alerts_api + location)
        } catch (error) {
            console.error('Error fetching weather data:', error)
        }
    }

    if (forecastdaily_results != undefined && forecasthourly_results != undefined && forecastalerts_results != undefined && forecastgriddata_results != undefined) {
        forecastdaily = await forecastdaily_results.json()
        forecastdaily = forecastdaily.properties.periods
        if (localdev == true) {
            console.log("Forecast Daily")
            console.log(forecastdaily)
        }

        forecasthourly = await forecasthourly_results.json()
        forecasthourly = forecasthourly.properties.periods
        if (localdev == true) {
            console.log("Forecast Hourly")
            console.log(forecasthourly)
        }
        
        forecastalerts = await forecastalerts_results.json()
        forecastalerts = forecastalerts.features
        if (localdev == true) {
            console.log("Forecast Alerts")
            console.log(forecastalerts)
        }

        forecastgriddata = await forecastgriddata_results.json()
        forecastgriddata = forecastgriddata.properties
        if (localdev == true) {
            console.log("Forecast Grid")
            console.log(forecastgriddata)
        }

        timezone = getTimeZoneName(forecastdaily[0].startTime.substring(forecastdaily[0].startTime.length - 6))
        elevation = Math.round(forecastgriddata.elevation.value) + formatUnitCode(forecastgriddata.elevation.unitCode)
    }
    
    // Display the current forecast in HTML
    // currentForecast(addressname, timezone, elevation, forecasthourly)
    hourlyForecast(forecasthourly)
    // dailyForecast(forecasthourly, forecastdaily)

    const waiting = document.getElementById("waiting")
    waiting.style.display="none"
    waiting.style.visibility="hidden"
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

function hourlyForecast(forecasthourly) {
    // console.log(forecasthourly)

    let hourlyforecasthtml = ""
    // hourlyforecasthtml = hourlyforecasthtml + "<div class=\"swiper\" id=\"swiper-hourly\">"
    // hourlyforecasthtml = hourlyforecasthtml + "<div class=\"swiper-wrapper\">"
    
    // for (let i = 0; i < forecasthourly.length; i++) {
    for (let i = 0; i < 4; i++) {
        console.log(formatDate(forecasthourly[i].startTime) + " | " + formatTime(forecasthourly[i].startTime))
        console.log("Dewpoint:" + forecasthourly[i].dewpoint.value + forecasthourly[i].dewpoint.unitCode.replace("wmoUnit:degC","C"))
        console.log(forecasthourly[i].startTime + " | " + forecasthourly[i].endTime)
        console.log(forecasthourly[i].icon)
        console.log(forecasthourly[i].isDaytime)
        console.log(forecasthourly[i].probabilityOfPrecipitation.value + forecasthourly[i].probabilityOfPrecipitation.unitCode.replace("wmoUnit:percent","%"))
        console.log(forecasthourly[i].relativeHumidity.value + forecasthourly[i].relativeHumidity.unitCode.replace("wmoUnit:percent","%"))
        console.log(forecasthourly[i].shortForecast)
        console.log(forecasthourly[i].temperature + forecasthourly[i].temperatureUnit)
        console.log(forecasthourly[i].windDirection + " " + forecasthourly[i].windSpeed)

        const forecastdate = formatDate(forecasthourly[i].startTime) + " | " + formatTime(forecasthourly[i].startTime)

        
        hourlyforecasthtml = hourlyforecasthtml + "<div class=\"swiper-slide\" id=\"hourly" + i + "\">"
        hourlyforecasthtml = hourlyforecasthtml + "<div style=\"text-align: center; border-style: dotted; max-width: 300px; margin: 10px auto; padding: 0px;\">"
        hourlyforecasthtml = hourlyforecasthtml + "<img id=\"dailyicon\"" + i + " src=\"\" />"
        hourlyforecasthtml = hourlyforecasthtml + "<h2>" + forecastdate + "</h2>"
        hourlyforecasthtml = hourlyforecasthtml + "</div></div>"
                        // hourlyforecast = hourlyforecast + "<table style="margin:auto; width:75%;">
                        // hourlyforecast = hourlyforecast + "<tr>
                        // hourlyforecast = hourlyforecast + "<td colspan="3">Day<br /><span id="dailydayhours0"></span></td>
                        // hourlyforecast = hourlyforecast + "</tr>
                        // hourlyforecast = hourlyforecast + "<tr>
                        // hourlyforecast = hourlyforecast + "<td style="width: 50%; text-align: center;">H:<span id="dailydayhightemp0"></span>&#176;</td>
                        // hourlyforecast = hourlyforecast + "<td style="width: 50%; text-align: center;">L:<span id="dailydaylowtemp0"></span>&#176;</td>
                    //     hourlyforecast = hourlyforecast + "<td sytle="width: 34%; text-align: center;"><span id="">Trend</span></td>
                    //     hourlyforecast = hourlyforecast + "</tr>
                    //     hourlyforecast = hourlyforecast + "<tr>
                    //                 <td style="width: 50%; text-align: center;"><span id="dailydayhightime0"></span></td>
                    //                 <td style="width: 50%; text-align: center;"><span id="dailydaylowtime0"></span></td>
                    //                 <td sytle="width: 34%; text-align: center;"><span id="dailydaytrend0"></span></td>
                    //             </tr>
                    //             <tr>
                    //                 <td colspan="3">Evening<br /><span id="dailyeveninghours0"></span></td>
                    //             </tr>
                    //             <tr>
                    //                 <td style="width: 50%; text-align: center;">H:<span id="dailyeveninghightemp0"></span>&#176;</td>
                    //                 <td style="width: 50%; text-align: center;">L:<span id="dailyeveninglowtemp0"></span>&#176;</td>
                    //                 <td sytle="width: 34%; text-align: center;"><span id="">Trend</span></td>
                    //             </tr>
                    //             <tr>
                    //                 <td style="width: 50%; text-align: center;"><span id="dailyeveninghightime0"></span></td>
                    //                 <td style="width: 50%; text-align: center;"><span id="dailyeveninglowtime0"></span></td>
                    //                 <td sytle="width: 34%; text-align: center;"><span id="dailyeveningtrend0"></span></td>
                    //             </tr>
                    //             <tr>
                    //                 <td colspan="3">Overnight<br /><span id="dailyovernighthours0"></span></td>
                    //             </tr>
                    //             <tr>
                    //                 <td style="width: 50%; text-align: center;">H:<span id="dailyovernighthightemp0"></span>&#176;</td>
                    //                 <td style="width: 50%; text-align: center;">L:<span id="dailyovernightlowtemp0"></span>&#176;</td>
                    //                 <td sytle="width: 34%; text-align: center;"><span id="">Trend</span></td>
                    //             </tr>
                    //             <tr>
                    //                 <td style="width: 50%; text-align: center;"><span id="dailyovernighthightime0"></span></td>
                    //                 <td style="width: 50%; text-align: center;"><span id="dailyovernightlowtime0"></span></td>
                    //                 <td sytle="width: 34%; text-align: center;"><span id="dailyovernighttrend0"></span></td>
                    //             </tr>    
                    //         </table>
                    //         <h4 id="dailyshortdescription0"></h4>
                    //         <p style="text-align: center;">
                    //         Forecast for <span id="currentaddressname">60532</span><br />
                    //         Timezone: <span id="currenttimezone">Timezone: Central</span><br />
                    //         Elevation: <span id="currentelevation">Elevation: 50'</span><br />
                    //         Precipitation: <span id="dailyprecipitation1"></span><br />
                    //         Humidity: <span id="dailyhumidity1"></span><br />
                    //         Wind Speed: <span id="dailywindspeed1"></span><br />
                    //         Wind Direction: <span id="dailywinddirection"></span>
                    //         </p>
                    //     </div>
                    // </div>        
    }

    // hourlyforecasthtml = hourlyforecasthtml + "</div>"
    // hourlyforecasthtml = hourlyforecasthtml + "<div class=\"swiper-button-prev\"></div>"
    // hourlyforecasthtml = hourlyforecasthtml + "<div class=\"swiper-button-next\"></div>"
    // hourlyforecasthtml = hourlyforecasthtml + "</div>"

    console.log(hourlyforecasthtml)

    const hourlyforecast = document.getElementById("hourlyforecast")
    hourlyforecast.style.display = "block"
    hourlyforecast.style.visibility = "visible"
    hourlyforecast.innerHTML = hourlyforecasthtml


    document.addEventListener('DOMContentLoaded', function () {
        var swiperHourly = new Swiper('#swiper-hourly', {
            // Add your swiper configuration options here
            // For example:
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            }
        });
    });

    // swiperHourly.update()
}

function dailyForecast(forecasthourly) {
    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];


    // hourlyforecast.innerHTML = "Hey"




        let date = new Date()    
        let dayCount = 0
        
        let day = evening = overnight = []
        let dayHigh = eveningHigh = overnightHigh = -999
        let dayHighTime = eveningHighTime = overnightHighTime = ""
        let dayLow = eveningLow = overnightLow = 999
        let dayLowTime = eveningLowTime = overnightLowTime = ""
        let dayTrend = eveningTrend = overnightTrend = ""
        let dayTrendCount = eveningTrendCount = overnightTrendCount = 0  
        let dayHourStart = "12:00"
        let dayHourEnd = "00:00"
        
        let daily = []

    forecasthourly.forEach((hourly) => {
        // Switch dates when the loop progresses to the next date
        if (formatDateComparison(hourly.startTime) != formatDateComparison(date)) {
            date.setDate(date.getDate() + 1)
            dayCount += 1
            
            day = evening = overnight = []
            dayHigh = eveningHigh = overnightHigh = -999
            dayHighTime = eveningHighTime = overnightHighTime = ""
            dayLow = eveningLow = overnightLow = 999
            dayLowTime = eveningLowTime = overnightLowTime = ""
            dayTrend = eveningTrend = overnightTrend = ""
            dayTrendCount = eveningTrendCount = overnightTrendCount = 0
        }
        // Get Daytime Hours
        if (hourly.isDaytime == true) {
            if (formatTimeComparison(hourly.startTime) < dayHourStart) { dayHourStart = formatTimeComparison(hourly.startTime)}
            if (formatTimeComparison(hourly.endTime) > dayHourEnd) { dayHourEnd = formatTimeComparison(hourly.endTime)}
        }

        // Day
        if (hourly.isDaytime == true ) {
            day.push(hourly.temperature)
            if (dayHigh < hourly.temperature) { dayHigh = hourly.temperature; dayHighTime = hourly.startTime }
            if (dayLow > hourly.temperature) { dayLow = hourly.temperature; dayLowTime = hourly.startTime }
            if (dayTrendCount > hourly.temperature) { dayTrend = "down" } else if ( dayTrendCount < hourly.temperature ) { dayTrend = "up" }
            dayTrendCount = hourly.temperature
        }

        // Evening
        if (hourly.isDaytime == false && formatTimeComparison(hourly.startTime) > "12:00") {
            evening.push(hourly.temperature)
            if (eveningHigh < hourly.temperature) { eveningHigh = hourly.temperature; eveningHighTime = hourly.startTime }
            if (eveningLow > hourly.temperature) { eveningLow = hourly.temperature; eveningLowTime = hourly.startTime }
            if (eveningTrendCount > hourly.temperature) { eveningTrend = "down" } else if ( eveningTrendCount < hourly.temperature ) { eveningTrend = "up" }
            eveningTrendCount = hourly.temperature
        }

        // Overnight
        if (hourly.isDaytime == false && formatTimeComparison(hourly.startTime) < "12:00") {
            overnight.push(hourly.temperature)
            if (overnightHigh < hourly.temperature) { overnightHigh = hourly.temperature; overnightHighTime = hourly.startTime }
            if (overnightLow > hourly.temperature) { overnightLow = hourly.temperature; overnightLowTime = hourly.startTime }
            if (overnightTrendCount > hourly.temperature) { overnightTrend = "down" } else if ( overnightTrendCount < hourly.temperature ) { overnightTrend = "up" }
            overnightTrendCount = hourly.temperature
        }
        // console.log(formatTimeComparison(hourly.startTime) + "|" + formatTimeFromComparison(dayHourStart))

        daily[dayCount] = [
            weekday[date.getDay()],                 // Day of the week
            dayHigh,                                // Daytime High
            formatTime(dayHighTime),                // Daytime High Time
            dayLow,                                 // Daytime Low
            formatTime(dayLowTime),                 // Daytime Low Time
            dayTrend,                               // Daytime Trend
            eveningHigh,                            // Evening High
            formatTime(eveningHighTime),            // Evening High Time
            eveningLow,                             // Evening Low
            formatTime(eveningLowTime),             // Evening Low Time
            eveningTrend,                           // Evening Trend
            overnightHigh,                          // Overnight High
            formatTime(overnightHighTime),          // Overnight High Time
            overnightLow,                           // Overnight Low
            formatTime(overnightLowTime),           // Overnight Low Time
            overnightTrend,                         // Overnight Trend
            formatTimeFromComparison(dayHourStart), // Daytime Start Time
            formatTimeFromComparison(dayHourEnd)    // Daytime End Time
            ]

            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
            // This needs to be paired with forecastdaily to create a useful array to loop through
            // Possible using the current date and time information of this loop to lookup in...
            // forecastweekly[0].startTime and forecastweekly[0].isDayTime
            // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    })

    // Loop to display daily values
for (let i = 0; i < daily.length; i++) {
    console.log(daily[i])
}

    for (let i = 0; i < 1; i++) {
    // for (let i = 0; i < daily.length; i++) {
        const dailyicon = document.getElementById("dailyicon" + i)
        const dailyday = document.getElementById("dailyday" + i)
        
        const dailydayhightemp = document.getElementById("dailydayhightemp" + i)
        const dailydaylowtemp = document.getElementById("dailydaylowtemp" + i)
        const dailydayhightime = document.getElementById("dailydayhightime" + i)
        const dailydaylowtime = document.getElementById("dailydaylowtime" + i)
        const dailydaytrend = document.getElementById("dailydaytrend" + i)
        const dailydayhours = document.getElementById("dailydayhours" + i)

        const dailyeveninghightemp = document.getElementById("dailyeveninghightemp" + i)
        const dailyeveninglowtemp = document.getElementById("dailyeveninglowtemp" + i)
        const dailyeveninghightime = document.getElementById("dailyeveninghightime" + i)
        const dailyeveninglowtime = document.getElementById("dailyeveninglowtime" + i)
        const dailyeveningtrend = document.getElementById("dailyeveningtrend" + i)
        const dailyeveninghours = document.getElementById("dailyeveninghours" + i)

        const dailyovernighthightemp = document.getElementById("dailyovernighthightemp" + i)
        const dailyovernightlowtemp = document.getElementById("dailyovernightlowtemp" + i)
        const dailyovernighthightime = document.getElementById("dailyovernighthightime" + i)
        const dailyovernightlowtime = document.getElementById("dailyovernightlowtime" + i)
        const dailyovernighttrend = document.getElementById("dailyovernighttrend" + i)
        const dailyovernighthours = document.getElementById("dailyovernighthours" + i)

        const dailyshortdescription = document.getElementById("dailyshortdescription" + i)
        const dailyaddressname = document.getElementById("dailyaddressname" + i)
        const dailytimezone = document.getElementById("dailytimezone" + i)
        const dailyelevation = document.getElementById("dailyelevation" + i) 
    
        // weekday[date.getDay()],         // Day of the week
        // dayHigh,                        // Daytime High
        // formatTime(dayHighTime),        // Daytime High Time
        // dayLow,                         // Daytime Low
        // formatTime(dayLowTime),         // Daytime Low Time
        // dayTrend,                       // Daytime Trend
        // eveningHigh,                    // Evening High
        // formatTime(eveningHighTime),    // Evening High Time
        // eveningLow,                     // Evening Low
        // formatTime(eveningLowTime),     // Evening Low Time
        // eveningTrend,                   // Evening Trend
        // overnightHigh,                  // Overnight High
        // formatTime(overnightHighTime),  // Overnight High Time
        // overnightLow,                   // Overnight Low
        // formatTime(overnightLowTime),   // Overnight Low Time
        // overnightTrend                  // Overnight Trend



        // dailyicon.src = forecasthourly[0].icon.replace(",0?size=small","?size=medium")
        dailyday.innerHTML = daily[i][0]
        
        if (i == 0) {
            dailydayhours.innerHTML = "Ends " + daily[i][17]
        }
        
        dailydayhightemp.innerHTML = daily[i][1]
        dailydayhightime.innerHTML = daily[i][2]
        dailydaylowtemp.innerHTML = daily[i][3]
        dailydaylowtime.innerHTML = daily[0][4]
        if (daily[i][5] == "down") { 
            dailydaytrend.innerHTML = "<span style=\"color:blue;\">&#8595;</span>"
        } else if (daily[i][5] == "up") { 
            dailydaytrend.innerHTML = "<span style=\"color:red\";>&#8593;</span>"
        }

        dailyeveninghours.innerHTML = daily[i][17] + " - " + formatTimeFromComparison("00:00")
        dailyeveninghightemp.innerHTML = daily[i][6]
        dailyeveninghightime.innerHTML = daily[i][7]
        dailyeveninglowtemp.innerHTML = daily[i][8]
        dailyeveninglowtime.innerHTML = daily[0][9]
        if (daily[i][10] == "down") { 
            dailyeveningtrend.innerHTML = "<span style=\"color:blue;\">&#8595;</span>"
        } else if (daily[i][10] == "up") { 
            dailyeveningtrend.innerHTML = "<span style=\"color:red\";>&#8593;</span>"
        }

        dailyovernighthours.innerHTML = formatTimeFromComparison("00:00") + " - " + daily[i+1][16]
        dailyovernighthightemp.innerHTML = daily[i+1][11]
        dailyovernighthightime.innerHTML = daily[i+1][12]
        dailyovernightlowtemp.innerHTML = daily[i+1][13]
        dailyovernightlowtime.innerHTML = daily[i+1][14]
        if (daily[i+1][15] == "down") { 
            dailyovernighttrend.innerHTML = "<span style=\"color:blue;\">&#8595;</span>"
        } else if (daily[i+1][15] == "up") { 
            dailyovernighttrend.innerHTML = "<span style=\"color:red\";>&#8593;</span>"
        }
        dailyshortdescription.innerHTML = forecasthourly[0].shortForecast
        // dailyaddressname.innerHTML = addressname
        // dailytimezone.innerHTML = timezone
        // dailyelevation.innerHTML = elevation

    
    // console.log(daily[i])
    }

    const dailyforecast = document.getElementById("dailyforecast")
    dailyforecast.style.display = "block"
    dailyforecast.style.visibility = "visible"


}