const moment = require('moment-timezone')

const convert = require('./conversions')
const db = require('./db')

async function getWeather(location, forecast, twilight, variables) {
    console.log('IWO:Info', 'Building Current Forecast')
    const currentForecast = buidlCurrentForecast(location, forecast, twilight, variables.units)
    console.log('IWO:Info', 'Building Hourly Forecast')
    const hourlyForecast = buildHourlyForecast(location, forecast, twilight, variables.units)
    console.log('IWO:Info', 'Bulding Daily Forecast')
    const dailyForecast = buildDailyForecast(location, forecast, twilight, variables.units)
    console.log('IWO:Info', 'Building Alerts Forecast')

    const weather = {
        currentForecast: currentForecast,
        hourlyForecast: hourlyForecast,
        dailyForecast: dailyForecast,
    }
    return weather
}

function buidlCurrentForecast(location, forecast, twilight, units) {
    const timeZone = location.timeZone.zoneName
    const currentTime = moment().format()
    const currentDay = moment().tz(timeZone).format('YYYY-MM-DD')

    let indexTime = -1
    for (let i = 0; i < forecast.length; i++) {
        if (forecast[i].validTime > currentTime) {
            indexTime = i - 1
            break
        }
    }
    let indexDay = -1
    for (let i = 0; i < twilight.values.length; i++) {
        if (moment(twilight.values[i].sunrise).startOf('day').format('YYYY-MM-DD') == currentDay) {
            indexDay = i
            break
        }
    }
    let highTemp = -999
    let lowTemp = 999
    let highTime, lowTime
    for (let i = 0; i < forecast.length; i++) {
        if (moment(forecast[i].temperature.validTime).format('YYYY-MM-DD') == currentDay) {
            if (forecast[i].temperature.value > highTemp) {
                highTemp = forecast[i].temperature.value
                highTime = forecast[i].temperature.validTime
            }
            if (forecast[i].temperature.value < lowTemp) {
                lowTemp = forecast[i].temperature.value
                lowTime = forecast[i].temperature.validTime
            }
        }
    }
    highTemp = convert.convertTemperature(units, highTemp)
    highTime = moment(highTime).tz(timeZone).format('LT')
    lowTemp = convert.convertTemperature(units, lowTemp)
    lowTime = moment(lowTime).tz(timeZone).format('LT')

    const temperatureTrendHourCount = 5
    let temperatureSum = (temperatureAverage = 0)
    let currentTemperatureTrend = ''

    for (let i = indexTime; i < indexTime + temperatureTrendHourCount; i++) {
        temperatureSum += forecast[i].temperature.value
    }
    temperatureAverage = temperatureSum / temperatureTrendHourCount

    if (forecast[indexTime].temperature.value > temperatureAverage) {
        currentTemperatureTrend = '<span class="text-info">&#8595;</span>'
    } else if (forecast[indexTime].temperature.value < temperatureAverage) {
        currentTemperatureTrend = '<span class="text-danger";>&#8593;</span>'
    }

    let todaySunrise = null, todaySunset = null
    if (indexDay != -1) {
        todaySunrise = moment(twilight.values[indexDay].sunrise).format()
        todaySunset = moment(twilight.values[indexDay].sunset).format()
    }

    let timeOfDay
    if (currentTime > todaySunrise && currentTime < todaySunset) {
        timeOfDay = 'day'
    } else {
        timeOfDay = 'night'
    }

    const apparentTemperature = convert.convertTemperature(units, forecast[indexTime].apparentTemperature.value)
    const precipitation = forecast[indexTime].probabilityOfPrecipitation.value
    const skyCover = forecast[indexTime].skyCover.value
    const temperature = convert.convertTemperature(units, forecast[indexTime].temperature.value)
    const temperatureTime = forecast[indexTime].temperature.validTime
    // Add additional logic for when this has multiple values
    const weather = forecast[indexTime].weather.value
    const windGust = convert.convertSpeed(units, forecast[indexTime].windGust.value)
    const windSpeed = convert.convertSpeed(units, forecast[indexTime].windSpeed.value)

    const subForecast = getSubForecast(timeOfDay, precipitation, skyCover, weather)

    const currentForecast = {
        query: location.query,
        forecastTime: moment().tz(timeZone).format(),
        apparentTemperature: apparentTemperature,
        highTemp: highTemp,
        highTime: highTime,
        lowTemp: lowTemp,
        lowTime: lowTime,
        icon: 'icons/' + subForecast.icon + '_large.png',
        precipitation: precipitation,
        shortForecast: subForecast.shortForecast,
        sunrise: moment(todaySunrise).tz(timeZone).format('LT'),
        sunset: moment(todaySunset).tz(timeZone).format('LT'),
        temperature: temperature,
        temperatureTime: moment(currentTime).tz(timeZone).format('LT'),
        temperaturetrend: currentTemperatureTrend,
        weather: weather[0].weather,
        windGust: windGust,
        windSpeed: windSpeed,
    }
    return currentForecast
}

function buildHourlyForecast(location, forecast, twilight, units) {
    const timeZone = location.timeZone.zoneName
    const todaySunrise = moment(twilight.values[0].sunrise).format()
    const todaySunset = moment(twilight.values[0].sunset).format()
    const tomorrowSunrise = moment(twilight.values[1].sunrise).format()
    const tomorrowSunset = moment(twilight.values[1].sunset).format()

    const currentTime = moment().startOf('hour').format()
    let index = -1
    for (let i = 0; i < forecast.length; i++) {
        if (forecast[i].temperature.validTime > currentTime) {
            index = i
            break
        }
    }

    let hourlyForecast = []
    for (let i = index - 1; i < index + 24; i++) {
        let timeOfDay
        const hourlyTime = moment(forecast[i].temperature.validTime).format()
        if ((hourlyTime > todaySunrise && hourlyTime < todaySunset) || (hourlyTime > tomorrowSunrise && hourlyTime < tomorrowSunset)) {
            timeOfDay = 'day'
        } else {
            timeOfDay = 'night'
        }

        const apparentTemperature = convert.convertTemperature(units, forecast[i].apparentTemperature.value)
        const precipitation = forecast[i].probabilityOfPrecipitation.value
        const skyCover = forecast[i].skyCover.value
        const temperature = convert.convertTemperature(units, forecast[i].temperature.value)
        const temperatureTime = forecast[i].temperature.validTime
        // Add additional logic for when this has multiple values
        const weather = forecast[i].weather.value
        const windGust = convert.convertSpeed(units, forecast[i].windGust.value)
        const windSpeed = convert.convertSpeed(units, forecast[i].windSpeed.value)

        const subForecast = getSubForecast(timeOfDay, precipitation, skyCover, weather)

        const document = {...{
            query: location.query,
            forecastTime: moment().tz(timeZone).format(),
            apparentTemperature: apparentTemperature,
            icon: 'icons/' + subForecast.icon + '_large.png',
            precipitation: precipitation,
            shortForecast: subForecast.shortForecast,
            sunrise: moment(todaySunrise).tz(timeZone).format('LT'),
            sunset: moment(todaySunset).tz(timeZone).format('LT'),
            temperature: temperature,
            temperatureTime: moment(temperatureTime).tz(timeZone).format('LT'),
            weather: weather[0].weather,
            windGust: windGust,
            windSpeed: windSpeed,
            },
        }

        hourlyForecast.push(document)
    }
    return hourlyForecast
}

function buildDailyForecast(location, forecast, twilight, units) {
    const timeZone = location.timeZone.zoneName
    const currentDay = moment().tz(timeZone).format('YYYY-MM-DD')
    
    let sunrise, sunset
    let dailyForecast = []
    for (let i = 1; i < 7; i++) {
        const dailyDate = moment(currentDay).add(i, 'day').format('YYYY-MM-DD')
        const dayOfWeek = moment(dailyDate).format('dddd')
        for (let j = 0; j < twilight.values.length; j++) {
            if (moment(twilight.values[j].sunrise).format('YYYY-MM-DD') == dailyDate) {
                sunrise = moment(twilight.values[j].sunrise).format()
                sunset = moment(twilight.values[j].sunset).format()
            }
        }

        let morningTemps = [], dayTemps = [], eveningTemps = []
        let morningTimes = [], dayTimes = [], eveningTimes = []
        for (let j = 0; j < forecast.length; j++) {
            if (
                moment(forecast[j].temperature.validTime).tz(timeZone).format('YYYY-MM-DD') == moment(sunrise).tz(timeZone).format('YYYY-MM-DD') && 
                moment(forecast[j].temperature.validTime).tz(timeZone).format() < moment(sunrise).tz(timeZone).format()
            ) {
                morningTemps.push(forecast[j].temperature.value)
                morningTimes.push(forecast[j].temperature.validTime)
            }
            if (
                moment(forecast[j].temperature.validTime).tz(timeZone).format('YYYY-MM-DD') == moment(sunrise).tz(timeZone).format('YYYY-MM-DD') && 
                moment(forecast[j].temperature.validTime).tz(timeZone).format() > moment(sunrise).tz(timeZone).format() && 
                moment(forecast[j].temperature.validTime).tz(timeZone).format() < moment(sunset).tz(timeZone).format()
            ) {
                dayTemps.push(forecast[j].temperature.value)
                dayTimes.push(forecast[j].temperature.validTime)
            }
            if (
                moment(forecast[j].temperature.validTime).tz(timeZone).format('YYYY-MM-DD') == moment(sunrise).tz(timeZone).format('YYYY-MM-DD') && 
                moment(forecast[j].temperature.validTime).tz(timeZone).format() > moment(sunset).tz(timeZone).format()
            ) {
                eveningTemps.push(forecast[j].temperature.value)
                eveningTimes.push(forecast[j].temperature.validTime)
            }
        }

        const morningLowIndex = morningTemps.indexOf(Math.min(...morningTemps))
        const morningHighIndex = morningTemps.indexOf(Math.max(...morningTemps))
        const morningLow = convert.convertTemperature(units, morningTemps[morningLowIndex])
        const morningLowTime = moment(morningTimes[morningLowIndex]).tz(timeZone).format('LT')
        const morningHigh = convert.convertTemperature(units, morningTemps[morningHighIndex])
        const morningHighTime = moment(morningTimes[morningHighIndex]).tz(timeZone).format('LT')

        const dayLowIndex = dayTemps.indexOf(Math.min(...dayTemps))
        const dayHighIndex = dayTemps.indexOf(Math.max(...dayTemps))
        const dayLow = convert.convertTemperature(units, dayTemps[dayLowIndex])
        const dayLowTime = moment(dayTimes[dayLowIndex]).tz(timeZone).format('LT')
        const dayHigh = convert.convertTemperature(units,dayTemps[dayHighIndex])
        const dayHighTime = moment(dayTimes[dayHighIndex]).tz(timeZone).format('LT')

        const eveningLowIndex = eveningTemps.indexOf(Math.min(...eveningTemps))
        const eveningHighIndex = eveningTemps.indexOf(Math.max(...eveningTemps))
        const eveningLow = convert.convertTemperature(units, eveningTemps[eveningLowIndex])
        const eveningLowTime = moment(eveningTimes[eveningLowIndex]).tz(timeZone).format('LT')
        const eveningHigh = convert.convertTemperature(units, eveningTemps[eveningHighIndex])
        const eveningHighTime = moment(eveningTimes[eveningHighIndex]).tz(timeZone).format('LT')

        let morningWeather = [], dayWeather = [], eveningWeather = []


        for (let j = 0; j < forecast.length; j++) {
            if (forecast[j].weather != null) {
                if (
                    moment(forecast[j].weather.validTime).tz(timeZone).format('YYYY-MM-DD') == moment(sunrise).tz(timeZone).format('YYYY-MM-DD') && 
                    moment(forecast[j].weather.validTime).tz(timeZone).format() < moment(sunrise).tz(timeZone).format()
                ) {
                    const precipitation = forecast[j].probabilityOfPrecipitation.value
                    const skyCover = forecast[j].skyCover.value
                    const weather = forecast[j].weather.value[0].weather
                    morningWeather = [precipitation, skyCover, weather]
                }
                if (
                    moment(forecast[j].temperature.validTime).tz(timeZone).format('YYYY-MM-DD') == moment(sunrise).tz(timeZone).format('YYYY-MM-DD') && 
                    moment(forecast[j].temperature.validTime).tz(timeZone).format() > moment(sunrise).tz(timeZone).format() && 
                    moment(forecast[j].temperature.validTime).tz(timeZone).format() < moment(sunset).tz(timeZone).format()
                ) {
                    const precipitation = forecast[j].probabilityOfPrecipitation.value
                    const skyCover = forecast[j].skyCover.value
                    const weather = forecast[j].weather.value[0].weather
                    dayWeather = [precipitation, skyCover,weather]
                }
                if (
                    moment(forecast[j].temperature.validTime).tz(timeZone).format('YYYY-MM-DD') == moment(sunrise).tz(timeZone).format('YYYY-MM-DD') && 
                    moment(forecast[j].temperature.validTime).tz(timeZone).format() > moment(sunset).tz(timeZone).format()
                ) {
                    const precipitation = forecast[j].probabilityOfPrecipitation.value
                    const skyCover = forecast[j].skyCover.value
                    const weather = forecast[j].weather.value[0].weather
                    eveningWeather = [precipitation, skyCover, weather]
                }
            }
}
        const morningForecast = getSubForecast('night', morningWeather[0], morningWeather[1], morningWeather[2])
        const dayForecast = getSubForecast('day', dayWeather[0], dayWeather[1], dayWeather[2])
        const eveningForecast = getSubForecast('night', eveningWeather[0], eveningWeather[1], eveningWeather[2])

        const dailyMap = {
            dayOfWeek: dayOfWeek,
            morningLow: morningLow,
            morningLowTime: morningLowTime,
            morningHigh: morningHigh,
            morningHighTime: morningHighTime,
            dayLow: dayLow,
            dayLowTime: dayLowTime,
            dayHigh: dayHigh,
            dayHighTime: dayHighTime,
            eveningLow: eveningLow,
            eveningLowTime: eveningLowTime,
            eveningHigh: eveningHigh,
            eveningHighTime: eveningHighTime,
            sunrise: moment(sunrise).tz(timeZone).format('LT'),
            sunset: moment(sunset).tz(timeZone).format('LT'),
            morningForecast: {
                shortForecast: morningForecast.shortForecast,
                icon: 'icons/' + morningForecast.icon + '_large.png',
            },
            dayForecast: {
                shortForecast: dayForecast.shortForecast,
                icon: 'icons/' + dayForecast.icon + '_large.png',
            },
            eveningForecast: {
                shortForecast: eveningForecast.shortForecast,
                icon: 'icons/' + eveningForecast.icon + '_large.png',
            },
        }
        dailyForecast.push(dailyMap)
    }
    return dailyForecast
}

function getSubForecast(timeOfDay, precipitation, skyCover, weather) {
    let coverage = null, intensity = null, weather_type = null
    let subForecast = {}

    if (weather != null) {
        coverage = weather[0].coverage
        intensity = weather[0].intensity
        weather_type = weather[0].weather
    }

    // Precipitation > 0
    // skyCover > 0 < 26 = Mostly Clear, > 25 < 51 = Partly Cloudy,  > 50 < 76 = Mostly Cloudy, > 75 = Cloudy
    // intensity light, moderate, heavy, violent

    // Clear Day 10000
    if (skyCover == 0 && weather_type == null && intensity == null) {
        subForecast = {
            shortForecast: 'Clear, Sunny',
            icon: '10000_' + timeOfDay + '_clear',
        }
    }
    // Mostly Clear Day 11001
    else if (
        skyCover > 0 &&
        skyCover < 26 &&
        weather_type == null &&
        intensity == null
    ) {
        subForecast = {
            shortForecast: 'Mostly Clear',
            icon: '11000_' + timeOfDay + '_mostly_clear',
        }
    }
    //  Partly Cloudy Day 11010
    else if (
        skyCover > 25 &&
        skyCover < 51 &&
        weather_type == null &&
        intensity == null
    ) {
        subForecast = {
            shortForecast: 'Partly Cloudy',
            icon: '11010_' + timeOfDay + '_partly_cloudy',
        }
    }
    // Mostly Cloudy Day 11020
    else if (
        skyCover > 50 &&
        skyCover < 76 &&
        weather_type == null &&
        intensity == null
    ) {
        subForecast = {
            shortForecast: 'Mostly Cloudy',
            icon: '11020_' + timeOfDay + '_mostly_cloudy',
        }
    }
    // Cloudy Day 10010
    else if (skyCover > 75 && weather_type == null && intensity == null) {
        subForecast = {
            shortForecast: 'Cloudy',
            icon: '10010_' + timeOfDay + '_cloudy',
        }
    }

    // '11030': 'Partly Cloudy and Mostly Clear',
    // '21000': 'Light Fog',
    else if (
        skyCover == 0 &&
        coverage == 'patchy' &&
        weather_type == 'fog' &&
        intensity == null
    ) {
        subForecast = {
            shortForecast: 'Light Fog',
            icon: '21000_' + timeOfDay + '_fog_light',
        }
    }
    // '21010': 'Mostly Clear and Light Fog',
    // '21020': 'Partly Cloudy and Light Fog',
    else if (
        skyCover > 25 &&
        skyCover < 51 &&
        coverage == 'patchy' &&
        weather_type == 'fog' &&
        intensity == null
    ) {
        subForecast = {
            shortForecast: 'Partly Cloudy and Light Fog',
            icon: '21020_' + timeOfDay + '_fog_light_partly_cloudy',
        }
    }
    // '21030': 'Mostly Cloudy and Light Fog',
    else if (
        skyCover > 50 &&
        skyCover < 76 &&
        coverage == 'patchy' &&
        weather_type == 'fog' &&
        intensity == null
    ) {
        subForecast = {
            shortForecast: 'Mostly Cloudy and Light Fog',
            icon: '21030_' + timeOfDay + '_fog_light_mostly_cloudy',
        }
    }
    // '21060': 'Mostly Clear and Fog',
    // '21070': 'Partly Cloudy and Fog',
    // '21080': 'Mostly Cloudy and Fog',
    // else if (
    //     skyCover > 50 &&
    //     skyCover < 76 &&
    //     coverage == 'patchy' &&
    //     weather_type == 'fog' &&
    //     intensity == null
    // ) {
    //     subForecast = {
    //         shortForecast: 'Mostly Cloudy and Fog',
    //         icon: '21080_' + timeOfDay + '_fog_mostly_cloudy',
    //     }
    // }
    // '20000': 'Fog',
    // '42040': 'Partly Cloudy and Drizzle',
    // '42030': 'Mostly Clear and Drizzle',
    // '42050': 'Mostly Cloudy and Drizzle',
    // '40000': 'Drizzle',
    // '42000': 'Light Rain',
    else if (
        (weather_type == 'rain' || weather_type == 'rain_showers') &&
        intensity == 'light'
    ) {
        subForecast = {
            shortForecast: 'Light Rain',
            icon: '42000_' + timeOfDay + '_rain_light',
        }
    }
    // '42130': 'Mostly Clear and Light Rain',
    // '42140': 'Partly Cloudy and Light Rain',
    // '42150': 'Mostly Cloudy and Light Rain',
    // '42090': 'Mostly Clear and Rain'
    // else if (skyCover > 0 && skyCover < 26 && weather == 'rain' && intensity == null) {
    //     subForecast = {
    //         'shortForecast': 'Mostly Clear and Rain',
    //         'icon': '42090'
    //     }
    // }

    // '42080': 'Partly Cloudy and Rain 42080'
    // else if (skyCover > 25 && skyCover < 51 && coverage == 'slight_coverage' && weather == 'rain') {
    //     subForecast = {
    //         'shortForecast': 'Partly Cloudy and Rain',
    //         'icon': '42080_rain_partly_cloudy'
    //     }
    // }

    // '42100': 'Mostly Cloudy and Rain',
    // '40010': 'Rain',
    else if (
        (weather_type == 'rain' || weather_type == 'rain_showers') &&
        intensity == 'moderate'
    ) {
        subForecast = {
            shortForecast: 'Rain',
            icon: '40010_' + timeOfDay + '_rain',
        }
    }
    // '42110': 'Mostly Clear and Heavy Rain',
    // '42020': 'Partly Cloudy and Heavy Rain',
    // '42120': 'Mostly Cloudy and Heavy Rain',
    // '42010': 'Heavy Rain',
    // '51150': 'Mostly Clear and Flurries'
    // else if (skyCover > 0 && skyCover < 26 && weather == 'snow_showers' && intensity == null) {
    //     subForecast = {
    //         'shortForecast': 'Mostly Clear and Flurries',
    //         'icon': '51150_flurries_mostly_clear'
    //     }
    // }
    // '51160': 'Partly Cloudy and Flurries',
    // '51170': 'Mostly Cloudy and Flurries',
    // '50010': 'Flurries',
    // '51000': 'Light Snow',
    // '51020': 'Mostly Clear and Light Snow',
    // '51030': 'Partly Cloudy and Light Snow',
    // '51040': 'Mostly Cloudy and Light Snow',
    // '51220': 'Drizzle and Light Snow',
    // '51050': 'Mostly Clear and Snow',
    // '51060': 'Partly Cloudy and Snow',
    // '51070': 'Mostly Cloudy and Snow',
    // '50000': 'Snow',
    else if (
        (coverage == 'Likely' && weather_type == 'snow') ||
        (weather_type == 'snow_showers' && intensity == 'moderate')
    ) {
        subForecast = {
            shortForecast: 'Snow',
            icon: '50000_' + timeOfDay + '_snow',
        }
    }
    // '51010': 'Heavy Snow',
    // '51190': 'Mostly Clear and Heavy Snow',
    // '51200': 'Partly Cloudy and Heavy Snow',
    // '51210': 'Mostly Cloudy and Heavy Snow',
    // '51100': 'Drizzle and Snow',
    // '51080': 'Rain and Snow',
    // '51140': 'Snow and Freezing Rain',
    // '51120': 'Snow and Ice Pellets',
    // '60000': 'Freezing Drizzle',
    // '60030': 'Mostly Clear and Freezing drizzle',
    // '60020': 'Partly Cloudy and Freezing drizzle',
    // '60040': 'Mostly Cloudy and Freezing drizzle',
    // '62040': 'Drizzle and Freezing Drizzle',
    // '62060': 'Light Rain and Freezing Drizzle',
    // '62050': 'Mostly Clear and Light Freezing Rain',
    // '62030': 'Partly Cloudy and Light Freezing Rain',
    // '62090': 'Mostly Cloudy and Light Freezing Rain',
    // '62000': 'Light Freezing Rain',
    // '62130': 'Mostly Clear and Freezing Rain',
    // '62140': 'Partly Cloudy and Freezing Rain',
    // '62150': 'Mostly Cloudy and Freezing Rain',
    // '60010': 'Freezing Rain',
    // '62120': 'Drizzle and Freezing Rain',
    // '62200': 'Light Rain and Freezing Rain',
    // '62220': 'Rain and Freezing Rain',
    // '62070': 'Mostly Clear and Heavy Freezing Rain',
    // '62020': 'Partly Cloudy and Heavy Freezing Rain',
    // '62080': 'Mostly Cloudy and Heavy Freezing Rain',
    // '62010': 'Heavy Freezing Rain',
    // '71100': 'Mostly Clear and Light Ice Pellets',
    // '71110': 'Partly Cloudy and Light Ice Pellets',
    // '71120': 'Mostly Cloudy and Light Ice Pellets',
    // '71020': 'Light Ice Pellets',
    // '71080': 'Mostly Clear and Ice Pellets',
    // '71070': 'Partly Cloudy and Ice Pellets',
    // '71090': 'Mostly Cloudy and Ice Pellets',
    // '70000': 'Ice Pellets',
    // '71050': 'Drizzle and Ice Pellets',
    // '71060': 'Freezing Rain and Ice Pellets',
    // '71150': 'Light Rain and Ice Pellets',
    // '71170': 'Rain and Ice Pellets',
    // '71030': 'Freezing Rain and Heavy Ice Pellets',
    // '71130': 'Mostly Clear and Heavy Ice Pellets',
    // '71140': 'Partly Cloudy and Heavy Ice Pellets',
    // '71160': 'Mostly Cloudy and Heavy Ice Pellets',
    // '71010': 'Heavy Ice Pellets',
    // '80010': 'Mostly Clear and Thunderstorm',
    // '80030': 'Partly Cloudy and Thunderstorm',
    // '80020': 'Mostly Cloudy and Thunderstorm',
    // '80000': 'Thunderstorm'
    else if (weather_type == 'thunderstorms' && intensity == null) {
        subForecast = {
            shortForecast: 'Thunderstorm',
            icon: '80000_' + timeOfDay + '_tstorm',
        }
    } else {
        subForecast = {
            shortForecast: 'Unknown',
            icon: 'unknown',
        }
    }
    if (subForecast.shortForecast == 'Unknown') {
        const unknownForecast = {
            'precipitation': precipitation, 
            'sky_cover': skyCover, 
            'weather': weather,
        }
        db.insertUnknown(unknownForecast)
    }
    return subForecast
}

module.exports = {
    getWeather,
}
