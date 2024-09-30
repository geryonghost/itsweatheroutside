const environment = process.env.environment
const databaseConnectionString = process.env.databaseConnectionString

const { MongoClient } = require('mongodb')
const moment = require('moment-timezone')

const apis = require('./apis')
const convert = require('./conversions')
const dbName = 'itsweatheroutside'

let client

async function connectToDatabase() {
    client = new MongoClient(databaseConnectionString)
    await client.connect()
    console.log('IWO:Info Connected to MongoDB')
}

function getClient() {
    return client
}

async function getLocation(query, variables) {
    const client = getClient()
    const db = client.db(dbName)
    const collection = db.collection('locations')

    console.log('IWO:Info', 'Querying the locations collection for', query)
    try {
        const filter = { query: query }
        let location = await collection.findOne(filter)
        if (location == null) {
            console.log('IWO:Info', 'Query does not exist in locations collection')
            const coordinates = await apis.getCoordinates(query, variables)
            if (coordinates == 'error') {
                return 'error'
            }
            const forecastUrl = await apis.getForecastUrl(coordinates, variables)
            if (forecastUrl == 'error') {
                return 'error'
            }
            const timeZone = await apis.getTimeZone(coordinates, variables)
            if (timeZone == 'error') {
                return 'error'
            }

            if (coordinates != 'error' && forecastUrl != 'error' && timeZone != 'error') {
                location = {
                    query: query,
                    addressName: coordinates.addressname,
                    addressType: coordinates.addresstype,
                    lat: coordinates.lat,
                    lon: coordinates.lon,
                    forecastUrl: forecastUrl,
                    timeZone: timeZone,
                }
            }
            updateLocation(query, location)
        }
        return location
    } catch (error) {
        console.log('IWO:Error', 'Querying forecast from DB', error)
        return 'error'
    }
}

async function getForecast(location, variables) {
    console.log('IWO:Info', 'Getting forecast for', location.query)

    const client = getClient()
    const db = client.db(dbName)

    try {
        const collection = db.collection('forecasts')
        filter = { query: location.query, updateTime: { '$gt': moment().subtract(0,'minutes').format() } }
        let gridData
        let forecast = await collection.find(filter).toArray()

        if (forecast.length == 0) {
            console.log('IWO:Info', 'Forecast in DB is empty')
            
            // Get Alerts
            alerts = await apis.getAlerts(location, variables)
            if (alerts == 'error') { return 'error' } else if (alerts.length > 0 && environment != 'dev') {
               mail.sendMail('cyb3rsteven@gmail.com','Alerts for ' + location.query, JSON.stringify(alerts, null, 2))
            }
            
            // Get GridData
            gridData = await apis.getGridData(location, variables)
            if (gridData == 'error') { return 'error' }
            
            // Process GridData
            const processedGridData = convert.processGridData(gridData, location)
            if (processedGridData == 'error') { return 'error' }

            console.log('IWO:Info', 'Updating forecast in DB')
            for (let i = 0; i < processedGridData.length; i++) {
                await updateForecast(processedGridData[i])
            }

            forecast = {'gridData': processedGridData, 'alerts': alerts}
        }
        return forecast
    } catch (error) {
        console.log('IWO:Error', 'Querying forecast from DB', error)
        return 'error'
    }
}

async function getTwilight(location, variables) {
    console.log('IWO:Info', 'Getting twilight for', location.query)

    const client = getClient()
    const db = client.db(dbName)

    try {
        const collection = db.collection('twilight')
        filter = { query: location.query, validTime: { '$gt': moment().subtract(1,'day').format() } }
        const results = await collection.findOne(filter)

        if (results == null) {
            const twilight = await apis.getTwilight(location)
            if (twilight != null) {
                console.log('IWO:Info', 'Updating twilight in DB')
                updateTwilight(location.query, twilight)
            }
            return twilight
        } else {
            return results
        }
    } catch (error) {
        console.log('IWO:Error', 'Getting twilight from DB', error)
    }
}

async function updateForecast(forecast) {
    const client = getClient()
    const db = client.db(dbName)

    const forecastUpdate = {
        updateTime: moment().format(),
        ...forecast
    }

    try {
        const filter = {
            query: forecast.query,
            validTime: forecast.validTime,
        }
        const collection = db.collection('forecasts')
        await collection.updateOne(filter, { $set: forecastUpdate }, { upsert: true })
    } catch (error) {
        console.log('IWO:Error', 'Adding forecast to the DB', error)
    }
}

async function updateLocation(query, location) {
    console.log('IWO:Info', 'Updating location in DB')

    const client = getClient()
    const db = client.db(dbName)

    try {
        const collection = db.collection('locations')
        const filter = { query: query }
        await collection.updateOne(filter, { $set: location }, { upsert: true })
    } catch (error) {
        console.log('IWO:Error', 'updating the location in the DB', error)
    }
}

async function updateTwilight(query, twilight) {
    const client = getClient()
    const db = client.db(dbName)

    try {
        const collection = db.collection('twilight')
        const filter = { query: query }
        await collection.updateOne(filter, { $set: twilight }, { upsert: true })
    } catch (error) {
        console.log('IWO:Error', 'Updating twilight in DB', error)
    }
}

async function insertUnknown(weather) {
    console.log('IWO:Info', 'Inserting unknowns into DB')
    const client = getClient()
    const db = client.db(dbName)

    try {
        const collection = db.collection('unknowns')
        await collection.insertOne(weather)
    } catch (error) {
        console.log('IWO:Error', 'Inserting unknowns in DB', error)
    }
}

module.exports = {
    connectToDatabase,
    getClient,
    dbName,
    getForecast,
    getLocation,
    getTwilight,
    insertUnknown,
}
