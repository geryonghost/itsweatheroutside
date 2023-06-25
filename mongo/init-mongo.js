// db.getSiblingDB('admin').auth(
//     process.env.MONGO_INITDB_ROOT_USERNAME,
//     process.env.MONGO_INITDB_ROOT_PASSWORD
// );
// db.createUser({
//     user: process.env.MONGO_USER,
//     pwd: process.env.MONGO_PASSWORD,
//     roles: ["readWrite"],
// });
// db.use("admin")
// db.createCollection("lookup")
// db.lookup.insert({
//     "query": "60532",
//     "coordinates": {
//       "longitude":"111",
// 			"latitude":"222"
//     },
//     "points": {
//     	"gridid": "111",
//     	"gridx": "222",
//     	"gridy": "333"
//     }
// })

// db.createCollection("forecasts")
// db.forecasts.insert({
//   "query": "60532",
//   "coordinates": {
//     "longitude":"111",
//     "latitude":"222"
//   },
//   "points": {
//     "gridid": "111",
//     "gridx": "222",
//     "gridy": "333"
//   },
//   "number": "1",
//   "name": "1",
//   "temperature": "1",
//   "temperatureunit": "1",
//   "temperaturetrend": "1",
//   "windspeed": "1",
//   "winddirection": "1",
//   "shortforcast": "1",
//   "detailedforcast": "1",
//   "updated": "1"
// })
