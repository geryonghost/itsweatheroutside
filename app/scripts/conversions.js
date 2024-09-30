const moment = require('moment-timezone')

function convertSpeed(units, data) {
    let math, unit
    if (units == 'us') {
        math = Math.round(data * 0.6213711922)
        unit = math + ' MPH'
    }
    if (units == 'metric') {
        unit = data + ' KM/H'
    }
    return unit
}

function convertTemperature(units, data) {
    let math, unit
    if (units == 'us') {
        math = Math.round(data * 1.8 + 32)
        unit = math + '&#176;F'
    }
    if (units == 'metric') {
        unit = data + '&#176;C'
    }
    return unit
}

function convertValidTimeValues(values) {
    let validTimeValues = []
    for (let a = 0; a < values.length; a++) {
        const parts = values[a].validTime.split('/')
        const indexP = parts[1].indexOf('P')
        const indexD = parts[1].indexOf('D')
        const indexT = parts[1].indexOf('T')
        const indexH = parts[1].indexOf('H')
        const numberDays = parts[1].substring(indexP + 1, indexD)
        let numberHours = parts[1].substring(indexT + 1, indexH)

        if (numberDays > 0) {
            const daysInHours = numberDays * 24
            numberHours = Number(numberHours) + Number(daysInHours)
        }

        for (let i = 0; i < numberHours; i++) {
            const newTime = moment(parts[0]).add(i, 'hours').format()
            const newTimeValue = { validTime: newTime, value: values[a].value }
            validTimeValues.push(newTimeValue)
        }
    }
    return validTimeValues
}

function processGridData(gridData, location) {
    const timeZone = location.timeZone.zoneName

    const apparentTemperature = convertValidTimeValues(gridData.apparentTemperature.values)
    const probabilityOfPrecipitation = convertValidTimeValues(gridData.probabilityOfPrecipitation.values)
    const skyCover = convertValidTimeValues(gridData.skyCover.values)
    const temperature = convertValidTimeValues(gridData.temperature.values)
    const weather = convertValidTimeValues(gridData.weather.values)
    const windDirection = convertValidTimeValues(gridData.windDirection.values)
    const windGust = convertValidTimeValues(gridData.windGust.values)
    const windSpeed = convertValidTimeValues(gridData.windSpeed.values)

    let processedGridData = []
    for (let i = 0; i < temperature.length; i++) {
        processedGridData.push({
            query: location.query,
            validTime: temperature[i].validTime,
            apparentTemperature: apparentTemperature[i],
            probabilityOfPrecipitation: probabilityOfPrecipitation[i],
            skyCover: skyCover[i],
            temperature: temperature[i],
            weather: weather[i],
            windDirection: windDirection[i],
            windGust: windGust[i],
            windSpeed: windSpeed[i],
        })
    }
    return processedGridData
}

module.exports = {
    processGridData,
    convertSpeed,
    convertTemperature,
}
