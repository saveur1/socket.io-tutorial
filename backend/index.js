import express from 'express';
import { createServer } from 'node:http';
import { Server } from "socket.io";
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { availableParallelism } from 'node:os';
import cluster from 'node:cluster';
import { createAdapter, setupPrimary } from '@socket.io/cluster-adapter';

if(cluster.isPrimary){
    const numCPUs = availableParallelism();
    // create one worker per available core
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork({
            PORT: 5000 + i
        });
    }
  
  // set up the adapter on the primary thread
  setupPrimary();
}
else {

    // open the database file
    const db = await open({
        filename: 'chat.db',
        driver: sqlite3.Database
    });

    // create our 'messages' table (you can ignore the 'client_offset' column for now)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_offset TEXT UNIQUE,
            content TEXT
        );
    `);


    const app = express();
    const server = createServer(app);

    //middlewares
    app.use(cors({
        origin: "*"
    }));


    const io = new Server(server, {
        connectionStateRecovery: {},
        cors: {
            origin: "*"
        },
        // set up the adapter on each worker thread
        adapter: createAdapter()
    });


    const __dirname = dirname(fileURLToPath(import.meta.url));

    app.get('/', (req, res) => {
        res.sendFile(join(__dirname, 'index.html'));
    });


    //Socket IO
    io.on("connection", async(socket)=>{
        console.log("New User Connected.");

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });

        socket.on("chat message", async(message, clientOffset, callback)=> {
            let result;
            try {
                // store the message in the database
                result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?,?)', message, clientOffset);
            } catch (e) {
                if (e.errno === 19 /* SQLITE_CONSTRAINT */ ) {
                    // the message was already inserted, so we notify the client
                    callback({status:"duplicate"});
                } else {
                    // nothing to do, just let the client retry
                    console.log(e)
                }
                return;
            }
            // include the offset with the message
            io.emit('chat message', message, result.lastID);
            // acknowledge the event
            callback({status:"ok"});
        })

        if (!socket.recovered) {
            // if the connection state recovery was not successful
            try {
            await db.each('SELECT id, content FROM messages WHERE id > ?',
                [socket.handshake.auth.serverOffset || 0],
                (_err, row) => {
                socket.emit('chat message', row.content, row.id);
                }
            )
            } catch (e) {
            // something went wrong
            }
        }

    })
    
    // each worker will listen on a distinct port
    const PORT = process.env.PORT;

    server.listen(PORT, () => {
        console.log(`server running at http://localhost:${PORT}`);
    });

}