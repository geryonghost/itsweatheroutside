// // Search form
// const searchquery = document.getElementById("searchquery");
// const searchbutton = document.getElementById("searchbutton");

// searchbutton.addEventListener("click", function() {
//     getWeather(searchquery.value)
// });   

var queryString = window.location.search;

// Create a URLSearchParams object
var searchParams = new URLSearchParams(queryString);

// Get individual parameters
const query = searchParams.get('q');
if (query != "" && query != undefined && query != null) {
    getWeather(query)
} else {
    const searchhints = document.getElementById("searchhints")
    searchhints.style.display="block"
    searchhints.style.visibility="visible"
}