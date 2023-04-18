
import { createClient } from "redis"

import axios from "axios"
import express from "express"

const client = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port : 6379
  }
}
)
client.on("error", err => console.log("\n Redis connection error:\n", err))
await client.connect()
const URL = "https://www.themealdb.com/api/json/v1/1/"
const app = express()

console.log(`[backend] redis connected sucessfully on ${process.env.REDIS_HOST}:6379`)

app.get("/inventory/search", async (req, res) => {
  const {query } = req;
  const name = query.name
  if (name == null){
    res.status(400).json("Bad request")
    return
  }
  let redisRes = await client.get(name)
  if (redisRes){
    console.log("Data obtained from Redis")
    redisRes = JSON.parse(redisRes)
    res.status(200).json({list : redisRes.item});
  }else {
    console.log("Data from public API")
    const response = await axios.get(`${URL}search.php?s=${name}`).then(response => response.data)
    if (response.meals && response.meals[0]){
      for (let meal of response.meals){
        await client.set(meal.strMeal, JSON.stringify(meal))
      }
      res.status(200).json({list : response.meals})
    }else 
      res.status(500).json({response})
  }
})
app.get("/inventory", async (req, res) => { // without cache, just for testing
  const {query } = req;
  const name = query.name
  if (name == null){
    res.status(400).json("Bad request")
    return
  }
  const response = await axios.get(`${URL}search.php?s=${name}`).then(response => response.data)
  if (response.meals && response.meal.length > 0)
    res.status(200).json({list : response.meals})
  else 
    res.status(500).json({response})
})

app.get("/random", async (req, res) => {
  return await axios.get(`${URL}random.php`).then(response => res.status(200).json(response.data)).catch(err => res.status(500).json(err))
})
app.get("/", (req, res) => res.status(200).json("pong"))
app.listen(3000, () => console.log(`[backend] listening on port 3000`))