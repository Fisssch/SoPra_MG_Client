# Codenames +

SoPra FS25

## Introduction

Codenames + is a fun and easy way to play the classic board game with friends, right in your browser. Two teams compete to find their secret words on the board using one-word hints from their Spymaster. It's all about clever thinking, teamwork and avoiding the assasin word that ends the game immediatly. Easy to play and fun every time!

To keep the gameplay exciting, the game offers multiple modes:

- Classic Mode: Standard randomized words for a traditional experience.
- Own Words Mode: Players can contribute their own words to build a fully customized board.
- Theme Mode: Players can set a theme and the game auto generates words related to that theme.
- Timed Mode: Adds real-time pressure by limiting how long teams have to give hints or make guesses.

## Technologies
- React
- Javascript
- Typescript
- Tailwind CSS
- Next UI

## High-level components
Below are the main frontend components:

### Lobby ([page.tsx](https://github.com/Fisssch/SoPra_MG_Client/blob/main/app/lobby/%5Bid%5D/page.tsx))
As in all games, our lobby is the starting point. You can get there by creating a lobby on the main page. In the lobby you can then copy the lobby code and send it to your friends so that they can simply enter the code on the main page and join the lobby. There is also an option to open the lobby for general players. Then additional players can join the game even if they don't have the code but just want to join a game. The lobby always shows in real time how many players are in the lobby, which gamemode is selected, which role (spymaster or field operative) you have as a player and also which team you belong to (the background color). Every change is also displayed in real time for everyone else. You also have a chat function in the lobby. This allows you to write globally with everyone in the lobby, but also only with the team if you want to. As soon as everyone has pressed the ready button and there are enough players in the game (at least 4 players), the game will start automatically.

### Game ([page.tsx](https://github.com/Fisssch/SoPra_MG_Client/blob/main/app/game/%5Bid%5D/page.tsx))
In our game, a team will start at random. The spymasters see the whole board with the respective card colors. They then have to give a hint and a number as to how many words can be found with the hint. It is not possible to have spaces in the hint and it is also not possible to write a hint that is on the game board. After the hint has been submitted, it is displayed in real time for all players. The field operatives do not see the colors on the game board. The field operatives of the same team can then select cards. With a right click the card is selected and if you click on the dot in the upper right corner, the card is only selected temporarily. When you have selected a card, all players will receive a message telling them which card has been selected. the color of the card will also change. If the card was the opponent's color, it is automatically the opponent's turn. If the card was gray, it is also automatically the opponent's turn and if the card was black, you have lost the game immediately. If the card was the color of the team, then you can continue guessing, at least until the number given by the spymaster in the hint has been reached. You can also end the turn early. If a red or blue card is found, the number of cards to be found at the top left/right changes in real time. There you can also see how many cards are left to guess.

### Result ([page.tsx](https://github.com/Fisssch/SoPra_MG_Client/blob/main/app/result/%5Bid%5D/page.tsx))
Our result page shows us who won the game. You can also view the game board. Here the board is displayed so that you can see the colors of the individual cards. This way, the field operatives also know which cards belong to their team. You also have the option to go back to the lobby, but also to go back to the main page.

## Launch & Deployment
Clone the repository with the following command:   
`git clone (https://github.com/Fisssch/SoPra_MG_Client.git)`

Run the below command to install dependencies related to React before you start your application for the first time:   
`npm install`

Start the application with:  
`npm run dev`

This command will run the application locally on browser. If the browser does not open automatically, you can use the following link:
[http://localhost:3000](http://localhost:3000).

You can run the tests with:  
`npm run test`

The below command builds the app for production to the build folder:
`npm run build`
## Illustrations

Below are brief descriptions of the main user flows in the application, illustrated with screenshots.

### Start Page

The start page lets players create a lobby, join a existing one, read through the game rules or get an overview of all users.

![Start Page](./screenshots/startpage.png)

---

### Lobby

In the lobby, players wait until enough participants have joined. Roles are assigned, the gamemode can be selected and changed and the lobby code can be copied directly.

![Lobby](./screenshots/lobbypage.png)

---

### Game Page

The game board displays 25 word cards.  
Players take turns giving hints or guessing and can follow the game progress in real time.

- Example: Blue Spymaster can enter a hint. The spymaster can see which card belongs to which team.
![Game Page – Enter Hint](./screenshots/gamepage_blue_spymaster.png)

- Meanwhile the red spymaster has to wait for his turn.
![Game Page – Red spymaster waits for turn.](./screenshots/gamepage_red_spymaster.png)

- And the blue field operative waits for the hint while not seing which card belongs to which team. 
![Game Page – Blue field operative waits for a hint](./screenshots/gamepage_blue_fieldoperative.png)


---

### Result Page

At the end of the game, the result screen shows which team won and the board of the game. Players can then return to the start page or start a new game.

![Result Page](./screenshots/resultpage.png)


## Roadmap
- Add option/ gamemode where a AI will play as spymaster if you have less than 4 players.
- Update the result page, so that you will alswo know which player guessed which card and which hints where given by the spymaster.
- In game add a game history, where you can see which card was guessed and also which hints where given.

## Authors and acknowledgment
- [Silvan Wyss](https://github.com/Fisssch)
- [Elia Wyrsch](https://github.com/eliawy)
- [Mathis Beeler](https://github.com/beelermathis)
- [Luis Schmid](https://github.com/LooPyt)
- [Helinton Philip Pathmarajah](https://github.com/Helinton-Philip-Pathmarajah)

We thank Youssef Farag for his guidance as well as all teaching assistants of the module Software Engineering Praktikum at the University of Zurich for their feedback and considerations on our project.

## License

This project is licensed under the [Apache License 2.0](https://github.com/Fisssch/SoPra_MG_Server/blob/main/LICENSE)