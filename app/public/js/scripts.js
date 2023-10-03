if (window.navigator) {
    // Access properties and methods of window.navigator
    var userAgent = window.navigator.userAgent;
    var language = window.navigator.language;
    
    console.log("User Agent:", userAgent);
    console.log("Language:", language);

    // Get the user's locale
    const userLocale = window.navigator.language || window.navigator.userLanguage;

    // Create an Intl.NumberFormat object with the user's locale
    const numberFormat = new Intl.NumberFormat(userLocale);

    // Check if the user's locale uses the metric system (Celsius)
    const usesMetricSystem = numberFormat.resolvedOptions().unit === "celsius";

    if (usesMetricSystem) {
    console.log("Use Celsius");
    } else {
    console.log("Use Fahrenheit");
    }




} else {
    console.log("window.navigator is not available in this environment.");
}