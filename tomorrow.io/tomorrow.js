const tomorrow_apikey = process.env.tomorrow_apikey

const axios = require('axios'); // Used to connect to remote APIs
const moment = require('moment')


// https://www.tomorrow.io/weather-api/
// https://docs.tomorrow.io/reference/data-layers-core
// ICONS
// https://github.com/tomorrow-io-api/tomorrow-weather-codes
async function get_tomorrow_forecast(units) {    
    // pick the location, as a latlong pair
    let location = [40.758, -73.9855]
    
    // list the fields
    const fields = [
      'precipitationIntensity',
      'precipitationType',
      'windSpeed',
      'windGust',
      'windDirection',
      'temperature',
      'temperatureApparent',
      'temperatureAvg',
      'temperatureMax',
      'temperatureMin',
      'temperatureMinTime',
      'temperatureMax',
      'temperatureMaxTime',
      'cloudCover',
      'cloudBase',
      'cloudCeiling',
      'weatherCode',
      'weatherCodeDay',
      'weatherCodeNight'
    ]
    
    // choose the unit system, either metric or imperial
    // const units = 'imperial';
    
    // set the timesteps, like 'current', '1h' and '1d'
    const timesteps = ['current', '1h', '1d']
    
    // configure the time frame up to 6 hours back and 15 days out
    const now = moment.utc();
    const startTime = moment.utc(now).add(0, 'minutes').toISOString()
    const endTime = moment.utc(now).add(3, 'days').toISOString()
    
    tomorrow_url = 'https://api.tomorrow.io/v4/timelines?'
    tomorrow_url += '&location=' + location
    tomorrow_url += '&unites=' + units
    tomorrow_url += '&timesteps=' + timesteps
    tomorrow_url += '&fields=' + fields
    tomorrow_url += '&startTime=' + startTime
    tomorrow_url += '&endTime=' + endTime
    tomorrow_url += '&apikey=' + tomorrow_apikey
    
    console.log('IWO:Getting Tomorrow forecast')
    try {
        // console.log(getTimelineURL + '?' + getTimelineParameters)
        const results = await axios.get(tomorrow_url)
        if (results.status == 200) {
            console.log(results)
            console.log(results.headers)
            console.log(results.data.data.timelines[0].intervals)
            // console.log(results.data.timelines)
            console.log(results.data.data.warnings)
            // console.log(results.data.timelines.minutely[0])
            // console.log(results.data.timelines.hourly[0])
            // console.log(results.data.timelines.daily[0])
            // forecasturl = await results.data.properties.forecastGridData
        // } else if (results.status == 429) {
            // console.log('Rate Limit')
        } else {
            console.log('Query results in bad response status')
        }
    } catch (error) {
        if (error.response && error.response.status === 429) {
            // If 429 error, implement retry logic
            const retryAfter = error.response.headers['retry-after'] || 1; // You can customize the initial retry delay
      
            console.log
        }
        // console.error('Error fetching Tomorrow forecast', err)
        
    }

}

module.exports = {
    get_tomorrow_forecast,
}