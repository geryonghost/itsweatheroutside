// Read the query string
var queryString = window.location.search;

// Create a URLSearchParams object
var searchParams = new URLSearchParams(queryString);

// Get individual parameters
const query = searchParams.get('q');
if (query != "" && query != undefined && query != null) {
    getWeather(query)
    const searchquery = document.getElementById("searchquery")
    searchquery.value = query
} else {
    const searchhints = document.getElementById("searchhints")
    searchhints.style.display="block"
    searchhints.style.visibility="visible"
}