const statusIWO = process.env.statusIWO

const express = require('express')
const app = express()
const appPort = '3000'

const appDomain = 'itsweatheroutside.com'
const appEmail = 'webmaster@itsweatheroutside.com'
const userAgent = '(' + appDomain + ',' + appEmail + ')'

const variables = {
    units: 'us',
    appEmail: appEmail,
    userAgent: userAgent,
}

// Custom functions
const db = require('./scripts/db.js')
const forecasts = require('./scripts/forecasts.js')

// Connect to MongoDB when the application starts
db.connectToDatabase()

// Set express environment
app.set('view engine', 'ejs')
app.set('views', `${__dirname}/views`)
app.use(express.static(`${__dirname}/public`))

// Default view of the site
app.get('', async (req, res) => {
    if (statusIWO != 'maintenance') {
        const query = req.query.q

        if (query == '' || query == undefined) {
            res.render('index', {})
        } else {
            const location = await db.getLocation(query, variables)
            if (location == 'error') {
                res.render('index', { 'locationError': true })
            }
            const forecast = await db.getForecast(location, variables)
            if (forecast == 'error') {
                res.render('index', { 'forecastError': true })
            }
            const twilight = await db.getTwilight(location, variables)
            const weather = await forecasts.getWeather(location, forecast.gridData, twilight, variables)

            const currentForecast = weather.currentForecast
            const hourlyForecast = weather.hourlyForecast
            const dailyForecast = weather.dailyForecast
            const alertsForecast = forecast.alerts

            res.render('index', {
                currentForecast,
                hourlyForecast,
                dailyForecast,
                alertsForecast,
            })
        }
    } else {
        res.render('maintenance')
    }
})


//The 404 Route (ALWAYS Keep this as the last route)
app.get('*', function (req, res) {
    res.redirect('/')
})

// Start the server
app.listen(appPort, () => {
    console.log(`Server listening on port ${appPort}`)
});
