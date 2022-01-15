const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");
let db = null;

const initializeDabAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`Error message:${e.message}`);
    process.exit(1);
  }
};

initializeDabAndServer();

function movieNamesToObject(dbObject) {
  return {
    movieName: dbObject.movie_name,
  };
}

app.get("/movies/", async (request, response) => {
  const moviesList = `
    SELECT *
    FROM movie;`;

  const list = await db.all(moviesList);
  response.send(list.map((object) => movieNamesToObject(object)));
});

app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const addMovie = `
    INSERT INTO movie(director_id,movie_name,lead_actor)
    VALUES (
        ${directorId},
        '${movieName}',
        '${leadActor}'
    );
    `;
  await db.run(addMovie);
  response.send("Movie Successfully Added");
});

function convertToObject(object) {
  return {
    movieId: object.movie_id,
    directorId: object.director_id,
    movieName: object.movie_name,
    leadActor: object.lead_actor,
  };
}

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetails = `
    SELECT 
        *
    FROM 
        movie
    WHERE 
        movie_id=${movieId};`;
  let result = await db.get(getMovieDetails);
  response.send(convertToObject(result));
});

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const { directorId, movieName, leadActor } = request.body;
  const updateMovieDetails = `
UPDATE 
movie
SET 
director_id=${directorId},
movie_name='${movieName}',
lead_actor='${leadActor}'
WHERE
movie_id=${movieId};
`;
  const updatedData = await db.run(updateMovieDetails);
  response.send("Movie Details Updated");
});

app.delete("/movies/:movieId/", (request, response) => {
  const { movieId } = request.params;
  const deleteMovie = `
    DELETE FROM
        movie
    WHERE
        movie_id=${movieId};
    `;
  db.run(deleteMovie);
  response.send("Movie Removed");
});

function directorNamesToObject(dbObject) {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
}

app.get("/directors/", async (request, response) => {
  const directorsList = `
    SELECT *
    FROM director;`;

  const list = await db.all(directorsList);
  response.send(list.map((object) => directorNamesToObject(object)));
});

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const moviesList = `
    SELECT *
    FROM 
        director JOIN movie ON director.director_id=movie.director_id
    WHERE
        movie.director_id=${directorId};`;

  const list = await db.all(moviesList);
  response.send(list.map((object) => movieNamesToObject(object)));
});
module.exports = app;
