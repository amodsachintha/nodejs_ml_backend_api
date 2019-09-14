const express = require('express');
const app = express();
const { spawn } = require('child_process');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
let db = new sqlite3.Database(path.join(__dirname, 'db'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());

const initDB = () => {
    const sql = "CREATE TABLE IF NOT EXISTS prediction_history (id INTEGER PRIMARY KEY AUTOINCREMENT, pred_class VARCHAR(255) null, accuracy VARCHAR(255) null, province VARCHAR(255) null, month VARCHAR(255) null, day VARCHAR(255) null, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)";
    return new Promise((resolve, reject) => {
        db.run(sql, error => {
            if (error) reject(error);
            resolve();
        });
    })
};

const insertPredictionResult = (pred_class, accuracy, day, month, province) => {
    const sql = "INSERT INTO prediction_history (pred_class, accuracy, day, month, province) values (?, ?, ?, ?, ?)";
    return db.run(sql, [pred_class, accuracy, day, month, province]);
};

const getPredictionHistory = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM prediction_history;";
        db.all(sql, (err, result) => {
            if (err) reject(err);
            resolve(result);
        })
    });
}

app.get('/', (req, res) => res.status(400).json({ code: 400, data: 'cannot get /' }));

app.post('/predict', (req, res) => {
    console.log(req.body);
    const day = req.body.day,
        month = req.body.month,
        province = req.body.province;

    let execPromise = new Promise((resolve, reject) => {
        const execPred = spawn('python', ['prediction.py', '--d', day.value, '--m', month.value, '--p', province.value]);
        // const execPred = spawn('dir');
        execPred.stdout.on('data', data => {
            // console.log(`stdout: ${data}`);
        });
        execPred.stderr.on('data', data => {
            console.log(`stderr: ${data}`);
        });
        execPred.on('close', code => {
            console.log(`Child Process exited with code ${code}`);
            const resJson = require('./resJson');
            if (code === 0) {
                insertPredictionResult(resJson.class, resJson.accuracy, day.text, month.text, province.text);
                resolve({
                    class: resJson.class,
                    accuracy: resJson.accuracy
                });
            } else {
                reject({
                    msg: `Child process exited with code ${code}`
                });
            }
        });
    });

    execPromise.then(result => {
        res.status(200).json({
            code: 200,
            data: {
                class: result.class,
                accuracy: result.accuracy
            }
        })
    }).catch(e => {
        res.status(500).json({
            code: 500,
            data: e.msg
        });
    });
});

app.get('/history', (req, res) => {
    console.log(`Got request`);
    getPredictionHistory().then(result => {
        res.status(200).json({
            code: 200,
            data: result
        });
    }).catch(e => {
        res.status(500).json({
            code: 500,
            data: 'error'
        })
    })
});


initDB().then(() => {
    console.log(`initDB: Success`);
    app.listen(3000, () => {
        console.log(`Listening on port 3000`);
    });
}).catch(e => {
    console.log(`initDB: Fail\n ${e}`);
});

