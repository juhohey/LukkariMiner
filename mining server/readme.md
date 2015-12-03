#Mining server

Editable files are in nodesrc, compiled ones in nodedist.
To compile run babel-run.bat or just run the babel-cli command & node server.js.

Actual mining action is in Miner.js.



##Running

```
Start a local mongod
Compile scripts & lift server
-  Run Miner.start() in server.js
-  Or run Miner.test() in server.js
  * Set the url to mine before this
```

All available urls are mined by default. Also by default only schedules relevant, that's this week or in the future, are saved.
