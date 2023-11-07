# Skyy Weather
I find the general usefulness of weather apps to be less than useful. Sometimes it is the ever changing forecast or simplicity like the Highs and Lows that don't occur at the typical time (Highs in the middle of the night and lows during the day). I have started this as a pet project to:

1. Solve my pet peeves with other weather apps. I hope to allow crowd sourced requests.
2. Learn Node.js and MongoDB (However, this might be going away).

# NPM
Here are the NPM stuffs in use

1. npm init
2. npm install -g npm@9.7.1
3. npm install express
4. npm install axios
5. npm install dotenv
6. npm install -g ejs-lint
7. npm install swiper
8. npm install -g nodemon

I am not sure the best way to handle NPM packages, so this is also a learning experience.

# Current
The current code will take input in the form of `60101`, `Chicago, IL`, or `233 S Wacker Dr Chicago IL` which can increase the accuracy. This input is then passed to an API (I will share this later) to get the Longitude and Latitude which is passed to the Weather.gov API to get Grid and then various weather forecasts/alerts.

# To Do
1. Start using the ticketing system ing GitHub
2. GitHub security/workflows/code folder structure...
2. Start generating a functional UX for Mobile, Desktop, hopefully native apps.
3. Increase the amount of forecast data available on the page
4. Find placement for Ads to support the project
5. Determine the best way to store preferences
    * Cookies for local only settings
    * DB for multi-device preferences
        - What should be used as the identifier?
6. More...More...More
