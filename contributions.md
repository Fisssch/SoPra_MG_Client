# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - 21.03.25 to 27.03.25

| **Student** | **Date** | **Link to Commit** | **Description** | **Relevance** |
| ----------- | -------- | -------------------|-----------------| ------------- |
| **[Silvan Wyss](https://github.com/Fisssch)** | 24.03.25 | [Commit 1](https://github.com/Fisssch/SoPra_MG_Client/commit/c29a64b4f731641cc9d0947e52e20edb5d1ffb48) | Implemented websockets & ability to switch game mode | Websockets are needed for most of our game & we want ability to switch game mode |
|                    | 24.03.25   | [Commit 2](https://github.com/Fisssch/SoPra_MG_Server/commit/3d2b879523fbbc4bacdc8776c8d3fc0207991cf5) | Implemented websockets & ability to switch game mode | Websockets are needed for most of our game & we want ability to switch game mode |
|                    | 26.03.25   | [Commit 3](https://github.com/Fisssch/SoPra_MG_Server/commit/ea94ec6d922d01b47252792b8da6778e4d047f52) | Implemented a database connection to a mongodb & added save of creation dat of user to db | We want to have persistence & save the creation date of a user |
| **[Elia Wyrsch ](https://github.com/eliawy)** | 24.03.25  | [Commit 1](https://github.com/Fisssch/SoPra_MG_Client/commit/4d1c5530b02bc5198e68569ea14c339cae9af737) | Started with tailwind installation. | Helps us for the UI design throughout the project.  |
|                    | 25.03.25   | [Commit 2](https://github.com/Fisssch/SoPra_MG_Client/commit/79684d38c3d618e09cb9035158f874610d9a3ae2) | Added the registration page. | Login and register is needed to be able to play the game.  |
|                    | 25.03.25   | [Commit 3](https://github.com/Fisssch/SoPra_MG_Client/commit/400e6edc9fc6db1f8559e974a61ab6dfbd9d9411) | Added the login page. | Login and register is needed to be able to play the game. |
|                    | 25.03.25   | [Commit 4](https://github.com/Fisssch/SoPra_MG_Client/commit/dfc6116e30c2a8ed93b4e3c7c94537a995032a9d) | Adjusted the UI according to the figma templates. | A good user interface (UI) is important because it directly affects how users interact with an application.  |
|                    | 25.03.25   | [Commit 5](https://github.com/Fisssch/SoPra_MG_Client/commit/29a8e819f500047ae64f24763046b7f1b6028624) | Added the possibility to get an overview over all users. | Can look up if other users are online and offline which might be important for the user to decide if he wants to play a new round or not. | 
|                    | 25.03.25   | [Commit 6](https://github.com/Fisssch/SoPra_MG_Client/commit/0f8487034b17fc93686bdc2720aa728cb51f499f) | designed the "arrival page" from which users can navigate to login or register | Important for the user to first log in or register to join a lobby later. |
|                    | 25.03.25   | [Commit 7](https://github.com/Fisssch/SoPra_MG_Client/commit/e2f1240fc483c25b09a0fbd5ea541cc85352f1aa) | Added a main page from which users can join lobbys, view their profiles or look at the users overview. | Users are able to join lobbys, get an overview of their profile or get to the users overview. | 
|                    | 26.03.25   | [Commit 8](https://github.com/Fisssch/SoPra_MG_Client/commit/d56b3ded67c0d9067938198841f148c2ecc0dbfc) | Implemented Logout functionality | Deleting the token ensures that only logged in users can use the functionality of the game.  |
| **[Mathis Beeler](https://github.com/beelermathis)** | 24.03.25   | [Commit 1](https://github.com/Fisssch/SoPra_MG_Server/commit/4a63d5fc754614b854ebb43639ae8af44c4ec410) | Added the "register new user" functionallity & deleted name field from user object | register a new user is needed in order to create a profile and then play the game, since you need an account to play |
|                    | 24.03.25   | [Commit 2](https://github.com/Fisssch/SoPra_MG_Server/commit/8399981c46efaee7673d1152559953dcde0bd781) | Added "login" functionality | users want be able to logout and then log back in to their created account |
|                    | 24.03.25   | [Commit 3](https://github.com/Fisssch/SoPra_MG_Server/commit/20be6f66dda96e339a79f1ebbaccac79f1cb9153) | added "logout" functionality" | users want to logout when they are done playing the game |
|                    | 25.03.25   | [Commit 4](https://github.com/Fisssch/SoPra_MG_Server/commit/2c8d324e30fa578c45137d10cc15484b5ffbebb2) | added exposing authorization headers | we want to send the token in the header so the authorization header needs to be exposed, so the client can read out the token |
|                    | 26.03.25   | [Commit 5](https://github.com/Fisssch/SoPra_MG_Server/commit/777144ca8956088f03fa9a6877c080c50ddba6b5) | changed logout functionality | the client is just sending the token in order to logout a user and not token + username |
|                    | 26.03.25   | [Commit 6](https://github.com/Fisssch/SoPra_MG_Server/commit/976540b84a13a0a063ad7620fb4e6376094f671d) | added authentification for users overview, updated UsersGetDTO | the users overwiew is only accessable for logged in users |
|                    | 26.03.25   | [Commit 7](https://github.com/Fisssch/SoPra_MG_Server/commit/47c12687a3c5a79c38ee23baeca14b40666c907f) | added "user stats overview" functionality | logge din users want to inspect user profile in order to the user stats|
|                    | 26.03.25   | [Commit 8](https://github.com/Fisssch/SoPra_MG_Server/commit/85e13856dd49a4a32606f26d4d8ce5a27da1e18a) | added "edit" functionality as well as proper authentification | users want to edit their username or password, this is only possible for logged in users|
|                    | 26.03.25   | [Commit 9](https://github.com/Fisssch/SoPra_MG_Server/commit/ef4c364bb6031fcbbb038647f061e16c522ff43c) | added better user creation stats | when creating a new user profile the start stats are now 0 and not null, which is better to display |
| **[Helinton Philip Pathmarajah](https://github.com/Helinton-Philip-Pathmarajah)** | 24.03.25 | [Commit 1](https://github.com/Fisssch/SoPra_MG_Client/pull/55/commits/1447f2026cb98e4e281e98523240f703285c7bab) | There where a few issues with tailwind, added my downloads too | so that we can use tailwind to UI design throughout the project |
|                    | 24.03.25   | [Commit 2](https://github.com/Fisssch/SoPra_MG_Client/pull/56/commits/922d23356f1eaf234feda23c1280defa44a0fa12) | added  more downloades| so that we can use tailwind to UI design throughout the project |
|                    | 27.03.25   | [Commit 3](https://github.com/Fisssch/SoPra_MG_Client/pull/62/commits/7264a54a3fc2b6c94c0689fe9c267f9f0779bd25) | made the hole stats page with the right informations | With this users are finally able to see stats of the other players |
|                    | 27.03.25   | [Commit 4](https://github.com/Fisssch/SoPra_MG_Client/pull/62/commits/7264a54a3fc2b6c94c0689fe9c267f9f0779bd25) | made the hole stats page with the right informations | With this users are finally able to see stats of the other players |
|                    | 27.03.25   | [Commit 5](https://github.com/Fisssch/SoPra_MG_Client/pull/63/commits/8184a1ae8d08f43bb3291339dfe9da466f2c3fca) | made the change username and change password page as well as made it work correctly | This is important because we wanted to give the user the ability to change those information's if he wanted to and know the user can |
|                    | 27.03.25   | [Commit 6](https://github.com/Fisssch/SoPra_MG_Client/pull/64/commits/b771847f45e003a0c96e41650933166aa2ea975d) | made that only logged in users can go to the main page | We wanted to make the game only usable for registered users and now they can get to the main page without registration |
| **[Luis Schmid](https://github.com/LooPyt)** | 23.03.25 | [Commit 1](https://github.com/Fisssch/SoPra_MG_Server/commit/559f18dc694b10fa9e17f153e5ad602986224abc) | Added Player and Team entities | Prerequisite for lobby logic |
|            | 25.03.25 | [Commit 2](https://github.com/Fisssch/SoPra_MG_Server/commit/025cfdbb6725f855675646a3b36f0a3a36b33b80) | Implemented lobby creation w/ teams | Required for lobby/team-based setup |
|            | 25.03.25 | [Commit 3](https://github.com/Fisssch/SoPra_MG_Server/commit/3ae539fb06bb6173ab5d07af353163690d3b86fb) | Added LobbyService tests | Ensures functionality is tested |

---

## Contributions Week 2 - 28.03.25 to 03.04.25

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[Silvan Wyss](https://github.com/Fisssch)** | 28.03.25 | [Commit 1](https://github.com/Fisssch/SoPra_MG_Server/commit/2e84473fa1df7433f73113bfb3ec1259336a1b01) | Added ability to give a hint, which is validated, send the hint via websocket to all players and save it to the database | We want the spymaster to give a hint which should be validated and sent to all players so they can make their guesses accordingly |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser2]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 3 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
