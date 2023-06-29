require('dotenv').config();

const async = require('async');
const axios = require('axios');
const express = require('express');
const mongodb = require('mongodb');

const bodyParser = require('body-parser');
const { render } = require('ejs');

const api_weather = process.env.API_WEATHER;
const api_openstreetmap = process.env.API_OPENSTREETMAP;
const app_port = process.env.APP_PORT;
// const db_connection = process.env.DB_CONNECTION;
// const db_name = process.env.DB_NAME;
// const db_collection = process.env.DB_COLLECTION;

const app = express();

// Connect to MongoDB
let mongo_client, db, collection
try {
  console.log('Connecting to MongoDB');
  mongo_client = new mongodb.MongoClient(process.env.DB_CONNECTION, { useNewUrlParser: true });
  console.log('Connected to MongoDB');
  db = mongo_client.db(process.env.DB_NAME);
  console.log('MongoDB DB is set');
  collection = db.collection(process.env.DB_COLLECTION);
  console.log('MongoDB Collection is set');
} catch (error) {
  console.error('Error connecting to MongoDB', error);
}

// Function to detect empty JSON responses
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
// Function to get number of JSON responses
function lengthObject(obj) {
  return Object.keys(obj).length;
}

// getCollection(collection, 'Aurora IL', function (err, result) {
//   if (err) {
//     console.error('Error:', err);
//     return;
//   }

//   // console.log('Collection Result:', result);
//   console.log(result.periods[0])
// });



// test()

// async function test() {
// try {
//   const result = await getWeather('60532'); // Await the result of the function
//   console.log(result); // Output: Hello, world!
//   // res.send(result);
// } catch (error) {
//   console.error(error);
//   // res.status(500).send('Internal Server Error');
// }
// }
// console.log("Return Value: " + return_value);

// async function getCollection2(db, collection, search_query, callback) {
//   console.log('Starting async waterfall');
//   async.waterfall(
//     [
//       // // Step 1: Connect to MongoDB
//       // function connectToMongoDB(next) {
//       //   console.log('Attempting to connect to MongoDB');
//       //   new mongodb.MongoClient(db_connection, function (err, client) {
//       //   // mongodb.MongoClient.connect(db_connection, useNewUrlParser: true , function (err, client) {
//       //     console.log(client);
//       //     console.log('HERE');
//       //     if (err) {
//       //       return next(err);
//       //     }
//       //     const db = client.db(db_name);
//       //     next(null, db);
//       //   });
//       // },
//       // Step 2: Perform MongoDB query
//       function performQuery(db, collection, search_query, next) {
//         query = { 'query': search_query };
//         console.log(query);
//         console.log(collection);
//         db.collection(collection).find({query}).toArray(function (err, result) {
//           if (err) {
//             return next(err);
//           }
//           console.log(result);
//           next(null, result);
//         });
//       },
//     ],
//     function (err, result) {
//       callback(err, result);
//     }
//   )
// }

// async function getWeather(collection, search_query) {

//   let action
//   // let db, collection, 
//   let query, results
//   let mapdata
  
//   return new Promise((resolve, reject) => {
    
//     // Query the collection for an existing forecast
//     console.log('Querying the collection with: ' + search_query);
//     try {

  
//       query = { 'query': search_query };
//       results = collection.find(query).toArray();
  
//       if (!isEmptyObject(results)) {
//         const now = new Date();
//         const forecastfrom = new Date(results[0].forecastfrom)
//         const forecastdifference = Math.floor(Math.abs(forecastfrom - now) / (1000 * 60));        
//       }

//       if (!isEmptyObject(results) && forecastdifference <= 5) {
//         action = 'returnForecast';
//         console.log('Results are not empty and are current');
//         resolve(results);
//       } else if (!isEmptyObject(results) && forecastdifference > 5) {
//         action = 'getForecast';
//       } else {
//         action = 'getCoordinates';
//       }
//         // getCoordinates(query, db, collection)
//       // } else {
//       //   console.log('Empty Query, requesting lon/lat');
//       //   resolve('The query is empty');
//         // console.log('There are ' + lengthObject(mongo_results) + ' results for this query');
//         // const now = new Date();
//         // const forecastfrom = new Date(mongo_results[0].forecastfrom)
//         // const forecastdifference = Math.floor(Math.abs(forecastfrom - now) / (1000 * 60));
  
//         // console.log(forecastdifference);
        
//         // if (forecastdifference > 5) {
//         //   console.log("Forecast is older than 5 minutes, refreshing");
//         //   const lat = mongo_results[0].lat
//         //   const lon = mongo_results[0].lon
//         //   const forecasturl = mongo_results[0].forecasturl
//         //   getWeather(query, db, collection, lat, lon, forecasturl)
//         // } else {
//         //   console.log('Forecast is current, do nothing');
          
//         //   return mongo_results;
//         // }
//       // }
//     } catch (error) {
//       console.error('Error querying MongoDB', error);
//     }

//     if (action == 'getCoordinates') {
//       console.log('Empty Query, requesting lon/lat');
    
//       // Query OpenStreetMap to obtain the lon/lat of the search_query
//       try {
//         query = search_query + ' US';
//         console.log(query)
//         const mapdata_results = axios.get(api_openstreetmap, {
//             params: {
//                 q: query,
//                 format: 'json'
//             }
//         });
//         console.log(mapdata_results);
//         mapdata = mapdata_results.data;
    
//         if (isEmptyObject(mapdata)) {
//           console.log('Error in the query value')
//         } else if (lengthObject(mapdata) > 1) {
//           console.log('Query is returning multiple results')
//           console.log(Object.keys(mapdata).length)
//           console.log(mapdata)
//         } else {
//           console.log('Querying OpenStreetMapData successful');
//           const lat = mapdata[0].lat
//           const lon = mapdata[0].lon
    
//           // getWeather2(query, db, collection, lat, lon)
//         }
//       } catch (error) {
//         console.error('Error fetching openstreetmap data', error);
//       }
//   }
// }
// )};

async function getCollection(collection, search_query, callback) {
  // let db, collection, query, results

  console.log('Querying the collection with: ' + search_query);
  // return new Promise((resolve, reject) => {

  try {
    // const db = mongo_client.db(db_name);
    // const collection = db.collection(db_collection);

    query = { 'query': search_query };
    // query = { };
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

        getCoordinates(search_query, function (err, result) {
          if (err) {
            console.error('Error:', err);
            return;
          }
        
          // console.log('Coordinate Result:', result);
          // const coord_results = result
          callback(null, result);
        });
    }

    if (!isEmptyObject(results) && forecastdifference > 5) {
        console.log("Forecast is older than 5 minutes, refreshing");
        const lat = results[0].lat
        const lon = results[0].lon
        const forecasturl = results[0].forecasturl


        getWeather(collection, search_query, lat, lon, forecasturl, function (err, result) {
          if (err) {
            console.error('Error:', err);
            return;
          }
          callback(null, result);
        });
    } else {
        console.log('Forecast is current, do nothing');
        // console.log(JSON.stringify(results, null, 2));
        callback(null, results[0])
    }




        
      // getCoordinates(collection, search_query, callback)
      // callback(null, results);
      
    //   // console.log(coordinates);
    // } else {
    //   console.log('There are ' + lengthObject(results) + ' results for this query');
    //   callback(null, results);
      // db_client.close();
      
      // if (forecastdifference > 5) {
        // console.log("Forecast is older than 5 minutes, refreshing");
        // const lat = results[0].lat
        // const lon = results[0].lon
        // const forecasturl = results[0].forecasturl
        // getWeather(query, db, collection, lat, lon, forecasturl)
      // } else {
        // console.log('Forecast is current, do nothing');
        
        // resolve(results);
      // }
    // }
  } catch (error) {
    console.error('Error querying and rendering HTML', error);
    // res.status(500).send('Internal Server Error');
  }
  // console.log('Query Complete');
}
// )};


// Function to get Lat and Lon for defined Query
async function getCoordinates(search_query, callback) {
  // return new Promise((resolve, reject) => {
  api_query = search_query + ' US';
  console.log(api_query);
  try {
    const mapdata_results = await axios.get(api_openstreetmap, {
        params: {
            q: api_query,
            // q: 'Lisle IL US',
            format: 'json',
            'accept-language': 'en',
            'countrycodes':'us',
            limit:1,
            email:'support@domain.com'
        }
    });
    // console.log(mapdata_results);
    const mapdata = mapdata_results.data;
    console.log(mapdata);
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
      const lat = mapdata[0].lat
      const lon = mapdata[0].lon
      const forecasturl = 0

      // resolve(mapdata);
      getWeather(collection, search_query, lat, lon, forecasturl, function (err, result) {
        if (err) {
          console.error('Error:', err);
          return;
        }
      
        // console.log('Coordinate Result:', result);
        // const coord_results = result
        callback(null, result);
      });
      // getWeather(search_query, collection, lat, lon, forecasturl, callback)
    }
  } catch (error) {
    console.error('Error fetching openstreetmap data', error);
  }
// });
}

// Function to use forecasturl or lat and lon to obtain forecast
async function getWeather(collection, search_query, lat, lon, forecasturl, callback) {
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
      "query": search_query,
      "lat": lat,
      "lon": lon,
      "forecasturl": forecasturl,
      "forecastfrom": now,
    };

    const db_data = { ...document, ...weatherdata.properties };


    if (newquery == true) {
      console.log('Inserting forecast into MongoDB');
      collection.insertOne(db_data, function(err, result) {
        if (err) {
          console.error('Error inserting document:', err);
        } else {
          console.log('Document inserted successfully');
        }
      })
    } else {
      console.log('Updating forecast in MongoDB');
      const filter = { "query": search_query }
      collection.replaceOne(filter, db_data, function(err, result) {
        if (err) {
          console.error('Error replacing document:', err);
        } else {
          console.log('Document replaced successfully');
        }
      });
    }
    
    callback(null, db_data);

  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

// async function renderWeather(page='index',results) {
//   return new Promise((resolve, reject) => {
//     // Simulate an asynchronous operation
//     setTimeout(() => {
//       const result = results;
//       resolve(result);
//     }, 1000);
//   });



//   app.get('/', async (req, res) => {
//     res.render(page, {});
//   });
  
  
//   // res.render('weather÷', {});
// }








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

app.post('/weather', (req, res) => {
  let query = req.body.query;
  if (query != '') {
    query = query.replace(/\s+/g, ' ') //Replace multiple spaces with a single space
    query = query.trim();
    query = query.toLowerCase();
    query = query.replace('.','').replace(',','');
    query = query.replace('lane','ln');

  // let results
    try {
      getCollection(collection, query, function (err, results) {
        if (err) {
          console.error('Error:', err);
          return;
        }

    // console.log('Collection Result:', result);
        console.log(results.periods[0])
        // res.send(result.periods[0]);
        res.render('weather', {results});
      });
    } catch(error) {
      console.error('Error fetching weather data:', error);
    }
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

// rendex/rWeather()

// // Test functions at startup
// let query = '4402 Black Partridge Lane Lisle IL';
// getCollection(query)

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



