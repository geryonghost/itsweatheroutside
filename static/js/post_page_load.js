// Read the query string
var queryString = window.location.search;

// Create a URLSearchParams object
var searchParams = new URLSearchParams(queryString);

// Get individual parameters
const query = searchParams.get('q');
if (query != "" && query != undefined && query != null) {
    // Display waiting symbol
    const waiting = document.getElementById("waiting")
    waiting.style.display="block"
    waiting.style.visibility="visible"
    
    getWeather(query)
    
    // Populate the seach field
    const searchquery = document.getElementById("searchquery")
    searchquery.value = query
} else {
    const searchhints = document.getElementById("searchhints")
    searchhints.style.display="block"
    searchhints.style.visibility="visible"
}