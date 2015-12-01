#Mingin server

Editable files are in nodesrc, compiled one in nodedist.
To compile run babel-run.bat or just run the command.

##Developing

- Start a local mongod
- Start developing
- Compile scripts & lift server

##Running

All available urls are mined by default. Also by default only schedules relevant, that's this week or in the future, are saved.

- Start a local mongod
-  Run miner.start() in server.js
-  Or run miner.test() in server.js
  * Set the url to mine before this