import axios from "axios"

const URL = `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}/`
// const URL = "https://www.themealdb.com/api/json/v1/1/search.php?s=Arrabiata"

const value = await axios.get(URL).then(response => response.data).catch(err => err)


console.log("VALUE IS: ", value)