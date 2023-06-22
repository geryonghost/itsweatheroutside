const mongodb = require('mongodb')
const connectionurl = process.env.MONGO_URL
const client = new mongodb.MongoClient(connectionurl, { useNewUrlParser: true })

const express = require('express');
const app = express();
const port = 3000;

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Define a route for rendering the HTML page
app.get('/', async (req, res) => {
  try {
    const db = client.db('weather'); // Replace with your database name
    const collection = db.collection('forecasts'); // Replace with your collection name

    // Query the database
    const query = { /* Your query criteria */ };
    const results = await collection.find(query).toArray();
    
    console.log(results)

    // Render the HTML page and pass the results to the template
    res.render('index', { results });
  } catch (error) {
    console.error('Error querying and rendering HTML', error);
    res.status(500).send('Internal Server Error');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


// weather.gov API
const axios = require('axios');

// Define the API endpoint and the location you want to fetch weather data for
const weather_apiurl = 'https://api.weather.gov/points/';
// const location = '37.7749,-122.4194'; // Example: Latitude and longitude of San Francisco
const location = '41.732491408816706,-88.03594841925755' // Woodridge

// Function to fetch weather data
async function fetchWeatherData() {
  try {
    // Make a request to the API to get the forecast URL for the given location
    const response = await axios.get(weather_apiurl + location);
    const forecastUrl = response.data.properties.forecast;

    // Make a request to the forecast URL to get the weather data
    const forecastResponse = await axios.get(forecastUrl);
    const weatherData = forecastResponse.data;

    // Process and display the weather data
    console.log(JSON.stringify(weatherData, null, 2));
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

// Call the function to fetch weather data
fetchWeatherData();

// openstreetmap.org API
const openstreetmap_apiurl = 'https://nominatim.openstreetmap.org/search'
// /?format=json&limit=1&q='
const query = '60532' + ' ' + 'US'

async function fetchopenstreetmapdata() {
    console.log(openstreetmap_apiurl)
    console.log(query)
    try {
        const response = await axios.get(openstreetmap_apiurl, {
            params: {
                q: query,
                format: 'json'
            }
        });
        const openstreetmapdata = response.data;

        console.log(openstreetmapdata)
    } catch (error) {
        console.error('Error fetching openstreetmap data', error);
    }
}

// Call the function to fetch openstreetmap data
fetchopenstreetmapdata();










// // const http = require('http');

// // const hostname = '0.0.0.0';
// // const port = process.env.WEATHER_PORT;

// // const server = http.createServer((req, res) => {
// //   res.statusCode = 200;
// //   res.setHeader('Content-Type', 'text/plain');
// //   res.end('Hello World\n');
// // });

// // server.listen(port, hostname, () => {
// //   console.log(`Server running at http://${hostname}:${port}/`);
// // });

// // const utils = require("utils")

// // utils.dbConnect();


// const express = require("express");
// const hbs = require("hbs")
// const path = require("path")

// const app = express();
// // const hbs = require();
// // const path = require();



// app.set("view engine", "hbs");
// app.set("views", path.join(__dirname,"/views"));

// app.get("/", (req, res) => { 
//     res.render("index", {    
//         temperature: getMongo(), 
//     });
// });
// app.listen(3000, (req,res) => {  
//     console.log("Server running on 3000");
// })
// // const path = require('path');

// // app.use(express.static(path.join(__dirname, "/public")));
// // const server = app.listen(3000, async () => {
// //     try {
// //         // await mongoclient.connect();
// //         // database = mongoclient.db(process.env.MONGO_DB);
// //         // collection = database.collection(`${process.env.MONGO_COLLECTION}`);
// //         console.log("Listening at :3000");
// //     } catch (error) {
// //         console.error(error);
// //     }
// // });


// // MongoDB reference
// let db;

// // Get a DB connection when this module is loaded
// (function getDbConnection() {
//     utils.dbConnect().then((database) => {
//         db = database;
//     }).catch((err) => {
//         logger.error('Error while initializing DB: ' + err.message, 'lists-dao-mongogb.getDbConnection()');
//     });
// })();

// const mongodb = require('mongodb')
// const connectionurl = process.env.MONGO_URL
// const mongoclient = new mongodb.MongoClient(connectionurl, { useNewUrlParser: true })

// function getMongo() {
//     return new Promise((resolve, reject) => {
//     let lists = db.collection('shoppingLists');
//         lists.find({}).toArray((err, documents) => {
//         if (err) {
//         logger.error('Error occurred: ' + err.message, 'fetchAll()');
//         reject(err);
//         } else {
//         logger.debug('Raw data: ' + JSON.stringify(documents), 'fetchAll()');
//         resolve({ data: JSON.stringify(documents), statusCode: (documents.length > 0) ? 200 : 404 });
//         }
//         });
//         });
        







//     // const mongopromise = new Promise((resolve, reject) => {
//     //     mongoclient.connect();
//     //     database = mongoclient.db(process.env.MONGO_DB);
//     //     collection = database.collection(`${process.env.MONGO_COLLECTION}`);
//     //     const results = collection.find({}).toArray();
//     // })
    
//     // return results;
// }


// // app.get("/", async (request, response) => {
// //     try {
// //         await mongoclient.connect();
// //         database = mongoclient.db(process.env.MONGO_DB);
// //         collection = database.collection(`${process.env.MONGO_COLLECTION}`);
        
// //         const results = await collection.find({}).toArray();
// //         response.send(results);
// //     } catch (error) {
// //         response.status(500).send({ "message": error.message });
// //     }
// // });