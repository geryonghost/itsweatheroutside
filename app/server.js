require('dotenv').config();

const axios = require('axios');
const express = require('express');
const mongodb = require('mongodb');

const bodyParser = require('body-parser');

const api_weather = process.env.API_WEATHER;
const api_openstreetmap = process.env.API_OPENSTREETMAP;
const app_port = process.env.APP_PORT;
const db_connection = process.env.DB_CONNECTION;
const db_name = process.env.DB_NAME;
const db_collection = process.env.DB_COLLECTION;


const app = express();
const mongo_client = new mongodb.MongoClient(db_connection, { useNewUrlParser: true });


// Function to detect empty JSON responses
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
// Function to get number of JSON responses
function lengthObject(obj) {
  return Object.keys(obj).length;
}

async function getCollection(query) {
  console.log('Querying the collection with:' + query);
  try {
    const db = mongo_client.db(db_name);
    const collection = db.collection(db_collection);

    const mongo_query = { 'query': query };
    const mongo_results = await collection.find(mongo_query).toArray();

    if (isEmptyObject(mongo_results)) {
      console.log('Empty Query, request lon/lat');
      getCoordinates(query, db, collection)
    } else {
      console.log('There are ' + lengthObject(mongo_results) + ' results for this query');
      const now = new Date();
      const forecastfrom = new Date(mongo_results[0].forecastfrom)
      const forecastdifference = Math.floor(Math.abs(forecastfrom - now) / (1000 * 60));

      console.log(forecastdifference);
      
      if (forecastdifference > 5) {
        console.log("Forecast is older than 5 minutes, refreshing");
        const lat = mongo_results[0].lat
        const lon = mongo_results[0].lon
        const forecasturl = mongo_results[0].forecasturl
        getWeather(query, db, collection, lat, lon, forecasturl)
      } else {
        console.log('Forecast is current, do nothing');
        // Call function to display results
      }
    }
  } catch (error) {
    console.error('Error querying and rendering HTML', error);
    res.status(500).send('Internal Server Error');
  }
  console.log('Query Complete');
}

// Function to get Lat and Lon for defined Query
async function getCoordinates(query, db, collection) {
  try {
    const mapdata_results = await axios.get(api_openstreetmap, {
        params: {
            q: query,
            format: 'json'
        }
    });
    const mapdata = mapdata_results.data;

    if (isEmptyObject(mapdata)) {
      console.log('Error in the query value')
    } else if (lengthObject(mapdata) > 1) {
      console.log('Query is returning multiple results')
      console.log(Object.keys(mapdata).length)
      console.log(mapdata)
    } else {
      console.log('Querying OpenStreetMapData successful');
      const lat = mapdata[0].lat
      const lon = mapdata[0].lon

      getWeather(query, db, collection, lat, lon)
    }
  } catch (error) {
    console.error('Error fetching openstreetmap data', error);
  }
}

// Function to use forecasturl or lat and lon to obtain forecast
async function getWeather(query, db, collection, lat=0, lon=0, forecasturl=0) {
  let newquery = false

  if (forecasturl == 0) {
    try {
      newquery = true;
      const forecasturl_results = await axios.get(api_weather + lat + ',' + lon);
      forecasturl = forecasturl_results.data.properties.forecast
      console.log(forecasturl);
    } catch (err) {
      console.error('Error fetching forecasturl', err);
    }
  }
  try {
    const now = new Date().toISOString();
    const forecast_results = await axios.get(forecasturl);
    const weatherdata = forecast_results.data;
      
    const document = {
      "query": query,
      "lat": lat,
      "lon": lon,
      "forecasturl": forecasturl,
      "forecastfrom": now,
    };

    const db_data = { ...document, ...weatherdata.properties };


    if (newquery == true) {
      db.collection(db_collection).insertOne(db_data, function(err, result) {
        if (err) {
          console.error('Error inserting document:', err);
        } else {
          console.log('Document inserted successfully');
        }
      })
    } else {
      const filter = { "query": query }
      db.collection(db_collection).replaceOne(filter, db_data, function(err, result) {
        if (err) {
          console.error('Error replacing document:', err);
        } else {
          console.log('Document replaced successfully');
        }
      
        db_client.close();
      });
    }
    // Call function to display results
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

// Set the view engine to EJS
app.set('view engine', 'ejs');

// // Handle the form submission
app.use(bodyParser.urlencoded({ extended: false }));

// Start the server
app.listen(app_port, () => {
  console.log(`Server listening on port ${app_port}`);
});

app.get('/', async (req, res) => {
});

app.post('/submit', (req, res) => {
  // let query = req.body.query;
  // query = query.replace(/\s+/g, ' ') //Replace multiple spaces with a single space
  // query = query.trim();
  // query = query.toLowerCase();
  // query = query.replace('.','').replace(',','');
  // // query = query.replace('lane','ln');

  // // Do something with the submitted data
  // console.log('Submitted Query:', query);

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
});

// // Test functions at startup
let query = '4402 Black Partridge Lane Lisle IL';
getCollection(query)

// Function does the query exist in the DB
// const MongoClient = require('mongodb').MongoClient;

// Connection URL
// const url = 'mongodb://mongo:27017';

// Database Name
// const dbName = 'weather';

// function performMongoDBQuery(callback) {
//   console.log('The function is running');
//   client.connect('mongodb://mongo:27017', function (err, client) {
//     if (err) {
//       console.error('Error connecting to MongoDB:', err);
//       callback(err);
//       return;
//     }

//     console.log('Connected to MongoDB successfully');

//     const db = client.db(dbName);

//     // Perform your MongoDB query here
//     db.collection('forecasts').find({}).toArray(function (err, result) {
//       client.close();

//       if (err) {
//         console.error('Error executing MongoDB query:', err);
//         callback(err);
//         return;
//       }

//       console.log('MongoDB query executed successfully');
//       callback(null, result);
//     });
//   });
// }

// performMongoDBQuery(function (err, result) {
//   console.log('About to call the function');
//   if (err) {
//     console.error('Error:', err);
//     return;
//   }

//   console.log('Result:', result);
// });

// Function to read DB
// Read the DB and if exists and recent (newer 5 minutes) call the GPS function
// If exists, but is expired (older than 5 minutes) call weather function
// Function to obtain the GPS coordinates
// Use the query to get lat/lon
// Use the lat/lon to get weather points
// Use the weather points to get the weather
// Pass all this information into the DB





// // Define a route for rendering the HTML page

  // async.waterfall(
  //   [
  //     function doAll(next) {
  //         const db = client.db('weather'); // Replace with your database name
  //   const collection = db.collection('forecasts'); // Replace with your collection name

  //   // Query the database
  //   const query = { /* Your query criteria */ };
  //   const results = collection.find(query).toArray();
    
  //   console.log(results)

  //   // Render the HTML page and pass the results to the template
  //   res.render('index', { results });
  //   next(null, results);
  //     }
      // Step 1: Connect to MongoDB
      // function connectToMongoCollection(next) {
      //   client.db('weather', function (err, db) {
      //     if (err) {
      //       console.error('Error connecting to MongoDB:', err);
      //       return next(err);
      //     }
      //     console.log('Connected to MongoDB successfully');
      //     // const db = client.db(dbName);
      //     next(null, db);
      //   });
        // mongodb.MongoClient.connect(connectionurl, function (err, client) {
          // if (err) {
          //   console.error('Error connecting to MongoDB:', err);
          //   return next(err);
          // }
          // console.log('Connected to MongoDB successfully');
          // const db = client.db(dbName);
          // next(null, db);
        // });
      // },
      
      // Step 2: Perform MongoDB query
      // function performQuery(db, next) {
      //   // const db = client.db('weather'); // Replace with your database name
      //   // const collection = db.collection('forecasts'); // Replace with your collection name
        
      //   db.collection('forecasts').find({}).toArray(function (err, result) {
      //     if (err) {
      //       console.error('Error querying MongoDB collection:', err);
      //       return next(err);
      //     }
      //     console.log('Successfully queried MongoDB collection');
      //     next(null, result);
      //   });
      // },

      // function displayResults(result, next) {
      //   res.render('index', { result });
      // }
    // ]);


  // try {
    // const db = client.db('weather'); // Replace with your database name
    // const collection = db.collection('forecasts'); // Replace with your collection name

    // // Query the database
    // const query = { /* Your query criteria */ };
    // const results = await collection.find(query).toArray();
    
    // console.log(results)

    // Render the HTML page and pass the results to the template
    // res.render('index', { results });
  // res.render('index', { });
  // } catch (error) {
  //   console.error('Error querying and rendering HTML', error);
  //   res.status(500).send('Internal Server Error');
  // }





// // weather.gov API
// const axios = require('axios');

// // Define the API endpoint and the location you want to fetch weather data for
// const weather_apiurl = 'https://api.weather.gov/points/';
// // const location = '37.7749,-122.4194'; // Example: Latitude and longitude of San Francisco
// const location = '41.732491408816706,-88.03594841925755' // Woodridge

// // Function to fetch weather data
// async function fetchWeatherData() {
//   try {
//     // Make a request to the API to get the forecast URL for the given location
//     const response = await axios.get(weather_apiurl + location);
//     const forecastUrl = response.data.properties.forecast;

//     // Make a request to the forecast URL to get the weather data
//     const forecastResponse = await axios.get(forecastUrl);
//     const weatherData = forecastResponse.data;

//     // Process and display the weather data
//     console.log(JSON.stringify(weatherData, null, 2));
//   } catch (error) {
//     console.error('Error fetching weather data:', error);
//   }
// }

// // Call the function to fetch weather data
// // fetchWeatherData();

// // openstreetmap.org API

// // /?format=json&limit=1&q='
// // const query = '4402 black Parridge lisle il' + ' ' + 'US'

// async function fetchopenstreetmapdata(query) {
//     // console.log(openstreetmap_apiurl)
//     console.log(query)
//     try {
//         const response = await axios.get(openstreetmap_apiurl, {
//             params: {
//                 q: query,
//                 format: 'json'
//             }
//         });
//         const openstreetmapdata = response.data;
//         if (isEmptyObject(openstreetmapdata)) {
//         // if (openstreetmapdata == []) {
//           console.log('Error in the query value')
//         } else if (lengthObject(openstreetmapdata) > 1) {
//           console.log('Query is returning multiple results')
//         } else {
//           console.log(openstreetmapdata)
//           console.log(Object.keys(openstreetmapdata).length)
//       }
//     } catch (error) {
//         console.error('Error fetching openstreetmap data', error);
//     }
// }

// // Call the function to fetch openstreetmap data
// // fetchopenstreetmapdata();



