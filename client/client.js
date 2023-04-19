import axios from "axios"
import moment from "moment"
import fs from "fs"
const URL = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}/`
// const URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata"


const sleep = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const timeDiff  = (time1, time2) => { // for some reason, time1 and time2 are strings
    const time = moment(time1, "HH:mm:ss.SSS")
    const secondTime = moment(time2, "HH:mm:ss.SSS")
    let diff = time.diff(secondTime, 'miliseconds')
    if (diff >= 0)return diff
    return (diff*-1)
}
let dictionary = new Set() 
let randomTimes = []
let cacheTimes = []
let redisCalls = []

const getValues = async (URLAPI, redisTrack) => {
    let timeDifference = 0;
    let time = moment().format("HH:mm:ss.SSS")
    let secondTime = moment().format("HH:mm:ss.SSS")
    let value = await axios.get(URLAPI).then(response => {
        secondTime = moment().format("HH:mm:ss.SSS")
    return response.data
    }).catch(err => err)
    let meal
    /*
    Here exist three different ways to get the name of the meal
    In that way, we can compare the time difference between the three ways
    This is maded in this way because is more easy differentiate  between
        the API response and the redis response
    */
    if (value.meals && value.meals[0])meal = value.meals[0].strMeal
    else if (value.list && value.list[0])meal = value.list[0].strMeal
    if (redisTrack){
        if (value.redisList){
            meal = value.redisList.strMeal
            redisCalls.push(1)
        }else redisCalls.push(0)
    }
    timeDifference= timeDiff(time, secondTime)
    console.log("[client] Request time: ", timeDifference, "miliseconds")
    console.log("[client] Name of the meal: ", meal)
    if (!dictionary.has(meal.replace(/ /g, '%20')))
        dictionary.add(meal.replace(/ /g, '%20'))
    return timeDifference
}
const randomRequests = async() => { // this is just for add values to the dictionary
    console.log("\n[client] Getting 200 random values\n")
    for (let i = 0; i < 30; i++){
        let timeDiff=  await getValues(URL+"random")
        randomTimes.push(timeDiff)
    }
}
const getValuesWithCache = async () => {
    console.log("\n[client] Getting 200 values with cache\n")
    const array = Array.from(dictionary)
    for (let i = 0; i < 30; i++){
        let index = Math.floor(Math.random() * array.length)
        console.log("index", array)
        let timeDiff =  await getValues(URL+"inventory/search?name="+array[index], true)
        cacheTimes.push(timeDiff)
    }
}
const keepGoing = async () => {
    console.log("[client] Getting values again without cache")
    const totalTime = randomTimes.reduce((a, b) => a + b, 0) 
    randomTimes = []
    await randomRequests()
    const newTotalTime = randomTimes.reduce((a, b) => a + b, 0)
    if (totalTime + totalTime*0.4 < newTotalTime){
        console.log("[client] API performance decreased in a 40%")
        console.log("[client] Stopping requests")
    }else {
        console.log("[client] Waiting 10 seconds to get values again")
        sleep(10000)
        await keepGoing()
    }
}
const startRequests = async () => {
    await sleep(5000);
    await randomRequests()
    await getValuesWithCache()
}


await startRequests()
// save randomTimes and cacheTimes to a different file each
fs.writeFile("randomTimes.txt", randomTimes.join('\n'), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file randomTimes was saved!");
}
)
fs.writeFile("cacheTimes.txt", cacheTimes.join('\n'), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file cacheTimes was saved!");
}
)
fs.writeFile("redisCalls.txt", redisCalls.join('\n'), function(err) {
    if(err) {
        return console.log(err);
    }
    console.log("The file redisCalls was saved!");
}
)

await keepGoing()