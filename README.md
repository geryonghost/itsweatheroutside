# It's Weather Outside
itsweatheroutside.com is no longer operating until we get renewed interest from the community.

I find the general usefulness of weather apps to be less than useful. Sometimes it is the ever changing forecast or simplicity like the Highs and Lows that don't occur at the typical time (Highs in the middle of the night and lows during the day). I have started this as a pet project to:

1. Solve my pet peeves with other weather apps. I hope to allow crowd sourced requests.
2. Learn Node.js, React, and MongoDB.

## Current
The current code will take input in the form of `60101`, `Chicago, IL`, or `233 S Wacker Dr Chicago IL` which can increase the accuracy. This input is then passed to an API to get the Longitude and Latitude which is passed to the Weather.gov API to get Grid and then various weather forecasts and alerts.

## Build
This can be built locally with NPM and MongoDB.

## Notes for future changes
- Get forecast from API -> store in DB -> call the get forecast which pulls from the DB 
- Delete old DB entries (greater than 24 hours)
- Convert daily to look/act like the current
- ALL Convert to parallel API calls
- Handle weather[] options (thunderstorm vs rainy)
- Native Apps - React native

## Contact
If you want to reach out to the project to get it going again, please email steven@itsweatheroutside.com.
