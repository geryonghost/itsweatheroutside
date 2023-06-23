const mongodb = require('mongodb')
const express = require('express');
const bodyParser = require('body-parser');

const connectionurl = process.env.MONGO_URL
const client = new mongodb.MongoClient(connectionurl, { useNewUrlParser: true })
const app = express();
const port = 3000;
const openstreetmap_apiurl = 'https://nominatim.openstreetmap.org/search'

// Function to detect empty JSON responses
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}
// Function to get number of JSON responses
function lengthObject(obj) {
  return Object.keys(obj).length
}
// Function to read DB
// Read the DB and if exists and recent (newer 5 minutes) call the GPS function
// If exists, but is expired (older than 5 minutes) call weather function
// Function to obtain the GPS coordinates
// Use the query to get lat/lon
// Use the lat/lon to get weather points
// Use the weather points to get the weather
// Pass all this information into the DB

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Handle the form submission
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/submit', (req, res) => {
  let query = req.body.query;
  query = query.replace(/\s+/g, ' ') //Replace multiple spaces with a single space
  query = query.trim();
  query = query.toLowerCase();
  query = query.replace('.','').replace(',','');
  // query = query.replace('lane','ln');

  // Do something with the submitted data
  console.log('Submitted Query:', query);

  // Respond with a success message
  res.send('Form submitted successfully!');
  fetchopenstreetmapdata(query)
});

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
// fetchWeatherData();

// openstreetmap.org API

// /?format=json&limit=1&q='
// const query = '4402 black Parridge lisle il' + ' ' + 'US'

async function fetchopenstreetmapdata(query) {
    // console.log(openstreetmap_apiurl)
    console.log(query)
    try {
        const response = await axios.get(openstreetmap_apiurl, {
            params: {
                q: query,
                format: 'json'
            }
        });
        const openstreetmapdata = response.data;
        if (isEmptyObject(openstreetmapdata)) {
        // if (openstreetmapdata == []) {
          console.log('Error in the query value')
        } else if (lengthObject(openstreetmapdata) > 1) {
          console.log('Query is returning multiple results')
        } else {
          console.log(openstreetmapdata)
          console.log(Object.keys(openstreetmapdata).length)
      }
    } catch (error) {
        console.error('Error fetching openstreetmap data', error);
    }
}

// Call the function to fetch openstreetmap data
// fetchopenstreetmapdata();



