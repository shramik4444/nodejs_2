const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'cricketMatchDetails.db')

const app = express()

app.use(express.json())

let database = null

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}

initializeDbAndServer()

const convertMovieDbObjectToResponseObject = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  }
}

const convertplayermatchdetails = dbObject => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    // score: dbObject.score,
    // sixes: dbObject.sixes,
    // fours: dbObject.fours,
    // playerMatchId: dbObject.player_match_id,
    // playerId: dbObject.player_id,
  }
}

const convert = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

const convertDirectorDbObjectToResponseObject = dbObject => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  }
}

app.get('/players/', async (request, response) => {
  const getplayerQuery = `
    SELECT
      *
    FROM
      player_details;`
  const playerLIst = await database.all(getplayerQuery)
  response.send(
    playerLIst.map(each => convertDirectorDbObjectToResponseObject(each)),
  )
})

app.get('/players/:playerId', async (request, response) => {
  const {playerId} = request.params
  const getplayerQuery = `
    SELECT
      *
    FROM
      player_details
    WHERE 
     player_id = ${playerId};`
  const playerLIst = await database.get(getplayerQuery)
  response.send(convertDirectorDbObjectToResponseObject(playerLIst))
})

app.put('/players/:playerId/', async (request, response) => {
  const {playerId} = request.params
  const playerDetails = request.body
  const {playerName} = playerDetails
  const updateQuery = `
    UPDATE
      player_details
    SET
      player_name='${playerName}'
    WHERE
      player_id = ${playerId};`
  await database.run(updateQuery)
  response.send('Player Details Updated')
})

app.get('/matches/:matchId', async (request, response) => {
  const {matchId} = request.params
  const getplayerQuery = `
    SELECT
      *
    FROM
      match_details
    WHERE 
     match_id = ${matchId};`
  const matchList = await database.get(getplayerQuery)
  response.send(convertMovieDbObjectToResponseObject(matchList))
})

app.get('/players/:playerId/matches', async (request, response) => {
  const {playerId} = request.params
  const getplayerQuery = `
SELECT * 
FROM match_details
NATURAL JOIN player_match_score
WHERE player_id = ${playerId};`
  const playerLIst = await database.all(getplayerQuery)
  response.send(playerLIst.map(each => convertplayermatchdetails(each)))
})

app.get('/matches/:matchId/players', async (request, response) => {
  const {matchId} = request.params
  const getplayerQuery = `
SELECT * 
FROM player_match_score
NATURAL JOIN player_details
WHERE match_id = ${matchId};
`
  const playerLIst = await database.all(getplayerQuery)
  response.send(playerLIst.map(each => convert(each)))
})

app.get('/players/:playerId/playerScores/', async (request, response) => {
  const {playerId} = request.params
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`
  const playersMatchDetails = await database.get(getmatchPlayersQuery)
  response.send(playersMatchDetails)
})
module.exports = app
