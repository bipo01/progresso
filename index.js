import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import pg from "pg";
import env from "dotenv";

env.config();

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

const db = new pg.Client({
    connectionString: process.env.PG_URL,
});

db.connect();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
    const response = await db.query("SELECT * FROM progressotracker");
    const data = response.rows;
    const objetivos = data.map((objetivo) => objetivo.objetivo);
    const dias = data.map((dia) => dia.dias);

    const result = await db.query("SELECT * FROM diascheck ORDER BY id");
    const dataDiasCheck = result.rows;
    const diasCheck = dataDiasCheck.map((d) => d.dia);

    let diasSeparados = [];
    for (let i = 0; i < objetivos.length; i++) {
        diasSeparados.push(
            dataDiasCheck.filter(
                (dado) => dado.objetivo_progresso === objetivos[i]
            )
        );
    }

    console.log(diasSeparados);
    console.log(objetivos);

    res.render("index.ejs", {
        data: data,
        dias: dias,
        objetivos: objetivos,
        dataDiasCheck: dataDiasCheck,
        diasCheck: diasCheck,
        diasSeparados: diasSeparados,
    });
});

app.post("/add", (req, res) => {
    const dias = req.body.days;
    const objetivo = req.body.goalName;
    //const idProgresso = Number(req.body.idDaTabela);

    db.query("INSERT INTO progressotracker (objetivo, dias) VALUES($1, $2)", [
        objetivo,
        dias,
    ]);
    let dia = 0;
    for (let i = 0; i < dias; i++) {
        dia++;
        db.query(
            "INSERT INTO diascheck (dia, objetivo_progresso) VALUES($1, $2)",
            [dia, objetivo]
        );
    }

    res.redirect("/");
});

app.post("/delete", (req, res) => {
    const idDeletado = req.body.idDeletado;
    const objetivo = req.body.objetivoDeletado;
    console.log(objetivo);

    db.query("DELETE FROM progressotracker WHERE id = $1", [idDeletado]);

    db.query("DELETE FROM diascheck WHERE objetivo_progresso = $1", [objetivo]);

    res.redirect("/");
});

app.post("/checar", (req, res) => {
    const idDoChecado = req.body.idAChecar;
    let cor = req.body.cor;

    if (cor === "verde") {
        cor = "white";
        db.query("UPDATE diascheck SET cor = $1 WHERE id = $2", [
            cor,
            idDoChecado,
        ]);
    } else {
        cor = "verde";
        db.query("UPDATE diascheck SET cor = $1 WHERE id = $2", [
            cor,
            idDoChecado,
        ]);
    }

    res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server on ${port}`);
});
