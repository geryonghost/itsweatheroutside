// require('dotenv').config();

// const async = require('async');
const axios = require('axios'); // Used to connect to remote APIs
const express = require('express'); // Used to display HTML pages
const mongodb = require('mongodb'); // Used to connect to MongoDB

const bodyParser = require('body-parser'); // Used to handle HTML post
const { render } = require('ejs');

// const api_weather = process.env.API_WEATHER;
// const api_openstreetmap = process.env.API_OPENSTREETMAP;

// const db_connection = process.env.DB_CONNECTION;
// const db_name = process.env.DB_NAME;
// const db_collection = process.env.DB_COLLECTION;

const app = express();
const app_port = 3000;

// import Swiper JS
// const swiperapp = require('swiper');
// // import Swiper styles
// const swipercss = require('swiper/css');

// const swiper = new swiperapp(...);



// Function to convert Celsius to Fahrenheit
function celsiusToFahrenheit(celsius) {
  const fahrenheit = (celsius * 9/5) + 32;
  return fahrenheit;
}
// Function to convert Fahrenheit to Celsius
function fahrenheitToCelsius(fahrenheit) {
  const celsius = (fahrenheit - 32) * 5/9;
  return celsius;
}
// Function to detect empty JSON responses
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
// Function to get number of JSON responses
function lengthObject(obj) {
  return Object.keys(obj).length;
}

// getCollection('Boston MA', function (err, result) {
// getCollection('Aurora IL', function (err, result) {
//   if (err) {
//     console.error('Error:', err);
//     return;
//   }
// });







async function getWeather(search_query) {
  // Connect to MongoDB
  let mongo_client, db, collection
  try {
    console.log('Connecting to MongoDB');
    mongo_client = await mongodb.MongoClient.connect('mongodb://mongo:27017', { useNewUrlParser: true });
    console.log('Connected to MongoDB');
    db = mongo_client.db('weather');
    console.log('MongoDB DB is set');
    collection = db.collection('forecasts');
    console.log('MongoDB Collection is set');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }

  // Query MongoDB for existing forecast
  let weather_forecast, forecastdifference, update_mongodb
  let lat, lon, forecasturl

  console.log('Querying the collection with: ' + search_query);
  try {
    const query = { 'query': search_query };
    console.log(query);
    weather_forecast = await collection.find(query).toArray();
  } catch (err) {
    console.error(err);
  }
  
  console.log('There are ' + lengthObject(weather_forecast) + ' results');

  if (!isEmptyObject(weather_forecast)) {
    const now = new Date();
    const forecastfrom = new Date(weather_forecast[0].forecastfrom)
    forecastdifference = Math.floor(Math.abs(forecastfrom - now) / (1000 * 60));

    lat = weather_forecast[0].lat
    lon = weather_forecast[0].lon
    forecasturl = weather_forecast[0].forecasturl
    update_mongodb = true
  }

  

  // If MongoDB does not have a matching query, lookup the lat/lon
  if (isEmptyObject(weather_forecast)) {
    let mapdata;
    
    console.log('Collection is empty, requesting lat/lon');

    const query = search_query;
    console.log(query);
    try {
      const mapdata_results = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
              q: query,
              'format': 'json',
              'accept-language': 'en',
              'countrycodes':'us',
              'limit':1,
              'email':'support@domain.com'
          }
      });
  
      mapdata = mapdata_results.data;
      console.log(mapdata[0].lat + ',' + mapdata[0].lon)
  
      if (isEmptyObject(mapdata)) {
        console.error('Error in the query value');
        return;
      } else if (lengthObject(mapdata) > 1) {
        console.error('Query is returning multiple results');
        console.log(Object.keys(mapdata).length);
        console.log(mapdata);
        return;
      } else {
        console.log('Querying OpenStreetMapData successful');
      }
    } catch (error) {
      console.error('Error fetching openstreetmap data', error);
    }

    lat = mapdata[0].lat;
    lon = mapdata[0].lon;

  }
  
  // Get weather forecast
  if (isEmptyObject(weather_forecast) || forecastdifference > 5) {
    console.log("Forecast needs to be udpated");

    const weather_forecast_api = 'https://api.weather.gov/points/'
    const weather_alerts_api = 'https://api.weather.gov/alerts/active'  
    const location = lat + ',' + lon;
    
    if (update_mongodb != true) {
      console.log("Getting Forecast URL");
      try {
        const results = await axios.get(weather_forecast_api + lat + ',' + lon);
        forecasturl = results.data.properties.forecastGridData;
      } catch (err) {
        console.error('Error fetching forecast URL', err);
      }
    }
    
    let now, forecastweekly_results, forecasthourly_results, forecastgriddata_results, forecastalerts_results 
    try {
      now = new Date().toISOString();
      console.log("Requesting Weekly Forecast");
      forecastweekly_results = await axios.get(forecasturl + '/forecast');
      console.log("Requesting Hourly Forecast");
      forecasthourly_results = await axios.get(forecasturl + '/forecast/hourly');
      console.log("Requesting Grid");
      forecastgriddata_results = await axios.get(forecasturl);
      console.log("Requesting Alerts");
      forecastalerts_results = await axios.get(weather_alerts_api, {
        params: {
          point: location
        }
      });
    } catch (error) {
      console.error('Error fetching weather data:', error);
    }
  
    try {
      const document = {
        "query": search_query,
        "lat": lat,
        "lon": lon,
        "forecasturl": forecasturl,
        "forecastfrom": now,
      };
  
      let forecastweekly_json = {"forecastweekly" : forecastweekly_results.data.properties.periods};
      let forecasthourly_json = {"forecasthourly" : forecasthourly_results.data.properties.periods};
      let forecastalerts_json = {"forecastalerts" : forecastalerts_results.data.features};
      let forecastgriddata_json = {"griddata" : forecastgriddata_results.data.properties};
   
      const db_data = { ...document, ...forecastweekly_json, ...forecasthourly_json, ...forecastalerts_json, ...forecastgriddata_json };
  
      if (update_mongodb != true) {
        console.log('Inserting forecast into MongoDB'); 
        await collection.insertOne(db_data);
      } else {
        console.log('Updating forecast in MongoDB');
        const filter = { "query": search_query }
        await collection.replaceOne(filter, db_data);
      }

      weather_forecast = [db_data];
      // weather_forecast = "Test content"

      
    } catch (err) {
      console.error(err);
    }
  
    // const weather_results = await getWeather2(collection, search_query, lat, lon, forecasturl);
        // return weather_results;      
    // } else {
        // console.log('Forecast is current, do nothing');
        // return results;
    }

    mongo_client.close();
    return weather_forecast;
  // } catch (error) {
  //   console.error('Error querying and rendering HTML', error);
  //   res.status(500).send('Internal Server Error');
  // }

// If exists display
// If does not exist get
// If out of date get




















  

  //api.weather.com content
  // const location = lat + ',' + lon;
  // let newquery = false;
  // let forecastobservationstationsurl, forecastzoneurl, forecastcountyurl, forecastfireweatherzoneurl

  // If forecasturl, forecasthourlyurl, and forecastgriddataurl are set skip this step.
  // if (forecasturl == 0) {
  
  // // Use the lat and lon to determine the gridpoints URL
  // try {
  //   const results = await axios.get('https://api.weather.gov/points/' + lat + ',' + lon);
  //   forecasturl = results.data.properties.forecastGridData;
  // } catch (err) {
  //   console.error('Error fetching forecast URL', err);
  // }
  
  // // let now, forecast_results, forecasthourly_results, forecastgriddata_results, forecastalerts_results 
  // try {
  //   // now = new Date().toISOString();
  //   forecastweekly_results = await axios.get(forecasturl + '/forecast');
  //   forecasthourly_results = await axios.get(forecasturl + '/forecast/hourly');
  //   forecastgriddata_results = await axios.get(forecasturl);
  //   forecastalerts_results = await axios.get('https://api.weather.gov/alerts/active', {
  //     params: {
  //       point:  lat + ',' + lon
  //     }
  //   });

  //   let forecastweekly_json = {"forecast" : forecastweekly_results.data.properties.periods};
  //   let forecasthourly_json = {"forecasthourly" : forecasthourly_results.data.properties.periods};
  //   let forecastalerts_json = {"forecastalerts" : forecastalerts_results.data.features};
  //   let forecastgriddata_json = {"griddata" : forecastgriddata_results.data.properties};
 
  //   const db_data = { ...document, ...forecast_json, ...forecasthourly_json, ...forecastalerts_json, ...forecastgriddata_json };

  // } catch (error) {
  //   console.error('Error fetching weather data:', error);
  // }

}


async function getCollection(search_query) {
  // Connect to MongoDB
  let mongo_client, db, collection
  try {
    console.log('Connecting to MongoDB');
    mongo_client = new mongodb.MongoClient('mongodb://mongo:27017', { useNewUrlParser: true });
    console.log('Connected to MongoDB');
    db = mongo_client.db('weather');
    console.log('MongoDB DB is set');
    collection = db.collection('forecasts');
    console.log('MongoDB Collection is set');
  } catch (error) {
    console.error('Error connecting to MongoDB', error);
  }

  console.log('Querying the collection with: ' + search_query);
  try {
    query = { 'query': search_query };
    console.log(query)
    const results = await collection.find(query).toArray();

    console.log('There are ' + lengthObject(results) + ' results');

    let forecastdifference

    if (!isEmptyObject(results)) {
      const now = new Date();
      const forecastfrom = new Date(results[0].forecastfrom)
      forecastdifference = Math.floor(Math.abs(forecastfrom - now) / (1000 * 60));

      console.log('The forecast is ' + forecastdifference + ' minutes old');
    }

    if (isEmptyObject(results)) {
      console.log('Collection is empty, requesting lon/lat');
      const weather_results = await getCoordinates(search_query, collection);
      return weather_results;
    } else if (!isEmptyObject(results) && forecastdifference > 5) {
        console.log("Forecast is older than 5 minutes, refreshing");
        const lat = results[0].lat;
        const lon = results[0].lon;
        const forecasturl = results[0].forecasturl;
        const forecasthourlyurl = results[0].forecasthourlyurl;
        const forecastgriddataurl = results[0].forecastgriddataurl;

        const weather_results = await getWeather2(collection, search_query, lat, lon, forecasturl);
        return weather_results;      
    } else {
        console.log('Forecast is current, do nothing');
        return results;
    }
    mongo_client.close();
  } catch (error) {
    console.error('Error querying and rendering HTML', error);
    res.status(500).send('Internal Server Error');
  }
  
}

// Function to get Lat and Lon for defined Query
async function getCoordinates(search_query, collection) {
  openstreetmap_api = 'https://nominatim.openstreetmap.org/search';

  query = search_query;
  console.log(query);
  try {
    const mapdata_results = await axios.get(openstreetmap_api, {
        params: {
            q: query,
            format: 'json',
            'accept-language': 'en',
            'countrycodes':'us',
            limit:1,
            email:'support@domain.com'
        }
    });

    const mapdata = mapdata_results.data;
    console.log(mapdata[0].lat + ',' + mapdata[0].lon)

    if (isEmptyObject(mapdata)) {
      console.error('Error in the query value');
      return;
    } else if (lengthObject(mapdata) > 1) {
      console.error('Query is returning multiple results');
      console.log(Object.keys(mapdata).length);
      console.log(mapdata);
      return;
    } else {
      console.log('Querying OpenStreetMapData successful');
      const lat = mapdata[0].lat;
      const lon = mapdata[0].lon;
      const forecasturl = 0;

      const weather_results = await getWeather2(collection, search_query, lat, lon, forecasturl);
      return weather_results;
    }
  } catch (error) {
    console.error('Error fetching openstreetmap data', error);
  }
// });
}

// Function to use forecasturl or lat and lon to obtain forecast
async function getWeather2(collection, search_query, lat, lon, forecasturl) {
  const weather_forecast_api = 'https://api.weather.gov/points/'
  const weather_alerts_api = 'https://api.weather.gov/alerts/active'

  const location = lat + ',' + lon;
  let newquery = false;
  // let forecastobservationstationsurl, forecastzoneurl, forecastcountyurl, forecastfireweatherzoneurl

  // If forecasturl, forecasthourlyurl, and forecastgriddataurl are set skip this step.
  if (forecasturl == 0) {
    
    try {
      newquery = true;
      const results = await axios.get(weather_forecast_api + lat + ',' + lon);
      forecasturl = results.data.properties.forecastGridData;
    } catch (err) {
      console.error('Error fetching forecast URL', err);
    }
  }
  
  let now, forecast_results, forecasthourly_results, forecastgriddata_results, forecastalerts_results 
  try {
    now = new Date().toISOString();
    forecast_results = await axios.get(forecasturl + '/forecast');
    forecasthourly_results = await axios.get(forecasturl + '/forecast/hourly');
    forecastgriddata_results = await axios.get(forecasturl);
    forecastalerts_results = await axios.get(weather_alerts_api, {
      params: {
        point: location
      }
    });
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }

  try {
    const document = {
      "query": search_query,
      "lat": lat,
      "lon": lon,
      "forecasturl": forecasturl,
      "forecastfrom": now,
    };

    let forecast_json = {"forecast" : forecast_results.data.properties.periods};
    let forecasthourly_json = {"forecasthourly" : forecasthourly_results.data.properties.periods};
    let forecastalerts_json = {"forecastalerts" : forecastalerts_results.data.features};
    let forecastgriddata_json = {"griddata" : forecastgriddata_results.data.properties};
 
    const db_data = { ...document, ...forecast_json, ...forecasthourly_json, ...forecastalerts_json, ...forecastgriddata_json };

    if (newquery == true) {
      console.log('Inserting forecast into MongoDB'); 
      await collection.insertOne(db_data);
    } else {
      console.log('Updating forecast in MongoDB');
      const filter = { "query": search_query }
      await collection.replaceOne(filter, db_data);
    }
    
    return db_data;

  } catch (error) {
    console.error('Error processing data with MongoDB', error);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
// Set the view engine to EJS
app.set('view engine', 'ejs');

// // Handle the form submission
app.use(bodyParser.urlencoded({ extended: false }));

// Start the server
app.listen(app_port, () => {
  console.log(`Server listening on port ${app_port}`);
});

app.get('/', async (req, res) => {
  res.render('index', {});
});

app.post('/', async (req, res) => {
  let query = req.body.query;
  let forecast
  if (query != '') {
    query = query.replace(/\s+/g, ' ') //Replace multiple spaces with a single space
    query = query.trim();
    query = query.toLowerCase();
    query = query.replace('.','').replace(',','');
    query = query.replace('lane','ln');

    try {
      forecast = await getWeather(query);
        // return results.forecast
        // Forecast Alerts: Foreach [0] or [1].properties.event, headline,description     
      // });
      // return forecast;
      // 
      
      // console.log("Render complete");
      // console.warn(forecast);
      res.render('index', {forecast});
    }
    catch (error) {
      console.error(error)
      res.status(500).json({ success: false, error: error.message });
    }

    // console.log("Forecast should have been obtained");
    // console.log(forecast);
    
  }
//////////////////////////////////////////////////////////////////////////////////////////////

    // result = await getCollection(collection, query); // Await the result of the function
    // console.log(result); // Output: Hello, world!
  
});  
  // // Do something with the submitted data
  // console.log('Submitted Query:', query);
  
  // RETURNS ARE NOT WORKING TO POPULATE THESE RESULTS

  // const results = getCollection(collection, query);
  // console.log(results);
// } catch (error) {
//   console.error(error);
//   // res.status(500).send('Internal Server Error');
// }
//   if (result == 'empty') {
//     try {
//     result = await getCoordinates(query);
//     console.log(result);
//     } catch (error) {
//       console.error(error);
//     }
//   }

// } 
// else {
//   res.send('Query is empty');
// }
  // res.render('weather', { results });
  // res.render('index', {});
  // // Respond with a success message
  // res.send('Form submitted successfully!');

  // getForecast(query, (error, result) => {
  //   if (error) {
  //     console.error('Error:', error);
  //     return;
  //   }
  
  //   console.log('Result:', result);
  // });

  // // getForecast(query)
  // // fetchopenstreetmapdata(query)
// });

