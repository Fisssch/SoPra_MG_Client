'use client';

import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { webSocketService } from '../../api/webSocketService';
import { useApi } from "@/hooks/useApi";
import { useRouter } from 'next/navigation';
import { App } from 'antd';


type Card = {
    word: string;
    color: 'RED' | 'BLUE' | 'NEUTRAL' | 'BLACK';
    guessed: boolean;
    selected: boolean;
};

type GameData = {
    id: number;
    board: Card[];
    teamTurn: 'RED' | 'BLUE';
    status: string;
    startingTeam: 'RED' | 'BLUE';
    winningTeam: string | null;
    gameMode: string;
    turnDuration?: number;
};

type makeGuessDTO = {
    teamColor: 'RED' | 'BLUE';
    wordStr: string;
};

const GamePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const gameId = params.id as string;
  const apiService = useApi();
  const { message } = App.useApp();


  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hintText, setHintText] = useState('');
  const [hintNumber, setHintNumber] = useState(0);
  const [currentHint, setCurrentHint] = useState<{ hint: string; wordsCount: number } | null>(null);
  const getHintKey = (gameId: string | string[], team: string) => `hintSubmitted_${gameId}_${team}`;
  const previousTeamRef = useRef<'RED' | 'BLUE' | null>(null);
  const [remainingGuesses, setRemainingGuesses] = useState<number | null>(null);

  const ws = useRef(new webSocketService()).current;
  const initializedRef = useRef(false);

  const [isSpymaster, setIsSpymaster] = useState(false);
  const [teamColor, setTeamColor] = useState<'RED' | 'BLUE'>('RED');
  const [hintSubmitted, setHintSubmitted] = useState(false);

  const [countdown, setCountdown] = useState<number>(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const clearGameLocalStorage = (gameId: string) => {
    localStorage.removeItem(`currentHint_${gameId}`);
    localStorage.removeItem(`hintSubmitted_${gameId}_RED`);
    localStorage.removeItem(`hintSubmitted_${gameId}_BLUE`);
    localStorage.removeItem(`gameStartedOnce_${gameId}`);
    localStorage.removeItem("turnStartTime");
  };

  const formatWord = (word: string) =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

  const sendHint = async () => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    if (!token) {
      console.error("No token found when trying to send hint.");
      return;
    }
    try {
      console.log("Sending hint with payload:", {
        hint: hintText,
        wordsCount: hintNumber,

      });

      await apiService.put(`/game/${gameId}/hint`, {
        hint: hintText,
        wordsCount: hintNumber,
      }, {
        'Authorization': `Bearer ${token}`,
      });

      setHintText('');
      setHintNumber(0);
      localStorage.setItem(getHintKey(gameId, teamColor), "true");
      setHintSubmitted(true);
    } catch (err) {

      if (
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof err.message === 'string' &&
        'status' in err &&
        typeof (err as any).status === 'number'
      ) {
        const status = (err as any).status;
        const messageText = (err as any).message;
         // Handle specific error for hint matching a word on the board
        if (status === 400 && messageText.includes("Hint cannot be the same as a word on the board")) {
          message.error("Hint cannot be the same as a word on the board!");
          return;
      }
        if (status === 400 && messageText.includes("Hint cannot be empty")) {
          message.error("Please enter a hint that consists of only one word and is not empty");
          return;
        }
        if (status === 400 && messageText.includes("Word count must be at least 1")) {
          message.error("You must provide a number greater than 0 for the hint.");
          return;
        }
      }
      console.error("Unexpected error sending hint:", err); 
      message.error("Failed to send the hint. Please try again");
    }
  };
  const handleGuess = async (word: string) => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    const team = localStorage.getItem("playerTeam")?.toUpperCase(); // e.g., "RED" or "BLUE"

    if (!token || !team) {
      console.error("Missing token or team in localStorage.");
      return;
    }
    try {
      await apiService.put(`/game/${gameId}/guess`, {
        wordStr: word,
        teamColor: team,
      }, {
        'Authorization': `Bearer ${token}`,
      });

      // Update the guessed card locally
      setGameData((prevGameData) => {
        if (!prevGameData) return prevGameData;

        const updatedBoard = prevGameData.board.map((card) =>
            card.word === word ? {...card, guessed: true} : card
        );

        return {...prevGameData, board: updatedBoard};
      });
    } catch (err) {
      console.error("Error making guess:", err);
    }
  };

  const handleSelectedWord = async (word: string, selected: boolean) => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    const team = localStorage.getItem("playerTeam")?.toUpperCase();

    if (!token || !team) {
      console.error("Missing token or team in localStorage.");
      return;
    }

    try {
      await apiService.put(`/game/${gameId}/selectWord`, {
        wordStr: word,
        selected: !selected, // Toggle selection --> if already selected then it will deselect, if not selected then select
        teamColor: team
      }, {
        'Authorization': `Bearer ${token}`,
      });
    } catch (err) {
      console.error("Error selecting word:", err);
    }
  };

  const handleEndTurn = async () => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    if (!token) {
      console.error("No token found when trying to end turn.");
      return;
    }
    try {
      // Make a PUT request to the backend to end the turn
      await apiService.put(`/game/${gameId}/endTurn`, {}, {
        'Authorization': `Bearer ${token}`,
      });
      console.log("Turn ended successfully.");
    } catch (err) {
      console.error("Error ending turn:", err);
      message.error("Failed to end the turn. Please try again.");
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const fetchGame = async () => {
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) {
        setError("No token found in localStorage.");
        setLoading(false);
        return;
      }

      const storedColor = localStorage.getItem("playerTeam");
      const color = storedColor?.toUpperCase();
      if (color === "RED" || color === "BLUE") {
        setTeamColor(color);
        const submitted = localStorage.getItem(getHintKey(gameId, color)) === "true";
        setHintSubmitted(submitted);
      }

      const role = localStorage.getItem('isSpymaster'); // say it's "true"
      setIsSpymaster(role === 'true'); // becomes setIsSpymaster(true)

      try {
        // Get gamemode & starting team first
        const storedGameMode = localStorage.getItem('gameMode') ?? 'CLASSIC';
        const storedStartingTeam = (localStorage.getItem('startingTeam')?.toUpperCase() || 'RED') as 'RED' | 'BLUE';

        const res = await apiService.post(`/game/${gameId}/start`, {
          startingTeam: storedStartingTeam,
          gameMode: storedGameMode.toUpperCase()
        }, {
          'Authorization': `Bearer ${token}`,
        });

        setGameData(res.data as GameData);
        const gameData = res.data as GameData;
        console.log("Vom Backend empfangener GameMode:", gameData.gameMode);
        localStorage.setItem(`gameBoard_${gameId}`, JSON.stringify(gameData.board));

        // Restore remaining guesses from localStorage
        const storedRemainingGuesses = localStorage.getItem(`remainingGuesses_${gameId}`);
        if (storedRemainingGuesses) {
          setRemainingGuesses(parseInt(storedRemainingGuesses, 10));
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    const subscribeToUpdates = async () => {
      try {
        await ws.connect();

        // Subscribe to game board updates
        await ws.subscribe(`/topic/game/${gameId}/board`, (payload: { updatedBoard: Card[]; guessesLeft: number }) => {
          console.log("Received updated board and remaining guesses:", payload);
          const { updatedBoard, guessesLeft } = payload;

          // Update the game board
          setGameData((prev) => (prev ? { ...prev, board: updatedBoard } : prev));

          // Update remaining guesses
          setRemainingGuesses(guessesLeft);

          // Store the remaining guesses in localStorage
          localStorage.setItem(`remainingGuesses_${gameId}`, guessesLeft.toString());
        });

        // Subscribe to hint updates
        await ws.subscribe(`/topic/game/${gameId}/hint`, (payload: { hint: string; wordsCount: number; guessesLeft: number }) => {
          console.log("Received hint payload:", payload);
          const { hint, wordsCount, guessesLeft } = payload;

          // Update the current hint
          setCurrentHint({ hint, wordsCount });

          // Update remaining guesses
          setRemainingGuesses(guessesLeft);

          // Store the remaining guesses in localStorage
          localStorage.setItem(`remainingGuesses_${gameId}`, guessesLeft.toString());

          // Store the hint in localStorage
          localStorage.setItem(`currentHint_${gameId}`, JSON.stringify({ hint, wordsCount }));
        });

        // Subscribe to guess updates
        await ws.subscribe(`/topic/game/${gameId}/guess`, (guess: makeGuessDTO) => {
          setGameData((prev) => prev ? { ...prev, teamTurn: guess.teamColor } : prev);

          const content = guess.wordStr?.trim()
              ? (
                  <span>
                    Guessed word: <strong>{formatWord(guess.wordStr)}</strong>
                  </span>
                )
              : (
                  <span>
                    <strong>No word guessed.</strong>
                  </span>
              );

          message.open({
            type: 'info',
            content,
          });
        });

          // Subscribe to game completion
        await ws.subscribe(`/topic/game/${gameId}/gameCompleted`, (winningTeam: string) => {
          localStorage.setItem("winningTeam", winningTeam);
          clearGameLocalStorage(gameId);
          router.replace(`/result/${gameId}`);
        });
        await ws.subscribe(`/topic/game/${gameId}/turn`, (payload: { teamTurn: 'RED' | 'BLUE' }) => {
          console.log("Turn ended. Switching to the next team:", payload.teamTurn);

          // Reset local state if needed
          // Update the gameData state with the new teamTurn
          setGameData((prev) => (prev ? { ...prev, teamTurn: payload.teamTurn } : prev));
          setHintSubmitted(false);
          setCurrentHint(null);
          setRemainingGuesses(null);
        });
      } catch (e) {
        console.error("WebSocket connection failed:", e);
      }
    };

    fetchGame().then(subscribeToUpdates);

    return () => {
      ws.disconnect();
    };
  }, [apiService, gameId, router, getHintKey, ws]);

  useEffect(() => {
    if (!gameData?.teamTurn) return;
    const currentTeam = gameData.teamTurn;
    const previousTeam = previousTeamRef.current;

    if (previousTeam === null) {
      previousTeamRef.current = currentTeam;
      return;
    }

    if (previousTeam !== currentTeam) {
      localStorage.removeItem(`currentHint_${gameId}`);
      localStorage.removeItem(getHintKey(gameId, "RED"));
      localStorage.removeItem(getHintKey(gameId, "BLUE"));
      setHintSubmitted(false);
      setCurrentHint(null);
    }

    previousTeamRef.current = currentTeam;
  }, [gameData?.teamTurn]);

  useEffect(() => {
    if (gameData?.gameMode !== "TIMED") return;

    const duration = gameData.turnDuration || 60;

    // Nur wenn unser Team am Zug ist
    if (teamColor === gameData.teamTurn) {
      let startTime = localStorage.getItem("turnStartTime");

      // Wenn kein Startzeitpunkt gespeichert ist, jetzt speichern
      if (!startTime) {
        startTime = Date.now().toString();
        localStorage.setItem("turnStartTime", startTime);
      }

      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      const remaining = Math.max(duration - elapsed, 0);
      setCountdown(remaining);

      if (timerRef.current) clearInterval(timerRef.current);

      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Wenn gegnerisches Team dran ist: Startzeit zurücksetzen
      localStorage.removeItem("turnStartTime");
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    gameData?.teamTurn,
    gameData?.gameMode,
    gameData?.turnDuration,
    teamColor,
  ]);


  useEffect(() => {
    if (gameData?.gameMode) {
      console.log("Aktiver Spielmodus:", gameData.gameMode);
    }
  }, [gameData?.gameMode]);

  useEffect(() => {
    if (!gameData) return;
    const storedHint = localStorage.getItem(`currentHint_${gameId}`);
    if (storedHint) {
      try {
        const parsedHint = JSON.parse(storedHint);

        // Nur löschen, wenn ICH Spymaster BIN und MEIN Team dran ist (neuer Zug beginnt)
        if (gameData.teamTurn === teamColor && isSpymaster) {
          localStorage.removeItem(`currentHint_${gameId}`);
          // Entferne den alten Hint, damit ich einen neuen geben kann
          setCurrentHint(null);
        } else {
          // Gegnerisches Team oder Field Operative oder noch alter Zug → zeig den aktuellen Hint
          setCurrentHint(parsedHint);
        }
      } catch (e) {
        console.error("Could not parse stored hint:", e);
      }
    }
  }, [gameData?.teamTurn, teamColor, gameId, isSpymaster]);

  const initialGradient = 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)';
  const redTeamGradient = `linear-gradient(to right, #8b0000 0%, #a30000 10%, #ff4d4d 30%, #ff9999 50%, #ff4d4d 70%, #a30000 90%, #8b0000 100%)`;
  const blueTeamGradient = `linear-gradient(to right, #0a2a3a 0%, #367d9f 10%, #6eb8d6 30%, #a4d9f5 50%, #6eb8d6 70%, #367d9f 90%, #0a2a3a 100%)`;

  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({
    backgroundImage: initialGradient,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'background 1.5s ease-in-out',
  });

  useEffect(() => {
    if (teamColor === 'RED' || teamColor === 'BLUE') {
      const newGradient = teamColor === 'RED' ? redTeamGradient : blueTeamGradient;
      const startPos = '100% 0';
      const endPos = '0% 0';

      // 1. Sofort: Reset-Startposition (ohne Transition!)
      setBackgroundStyle({
        backgroundImage: `${newGradient}, ${initialGradient}`,
        backgroundPosition: startPos,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        transition: 'none', // Kein Übergang hier
      });

      // 2. Leicht verzögert: Übergang starten
      setTimeout(() => {
        setBackgroundStyle({
          backgroundImage: `${newGradient}, ${initialGradient}`,
          backgroundPosition: endPos,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          transition: 'background-position 1.5s ease-in-out',
        });
      }, 30); // 30ms sorgt zuverlässig für Trigger
    }
  }, [teamColor]);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-solid mb-6"></div>
          <p className="text-lg font-semibold">Loading game... Please wait.</p>
        </div>
    );
  }
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!gameData) return <div className="p-6 text-red-600">Failed to load game data.</div>;

    return (
        <div className="min-h-screen text-white px-4 py-6" style={backgroundStyle}>
          {/* Turn-based message / hint input */}
          <div className="text-center mb-6 mt-6 pt-5!">
            {/* Turn-based message */}
            {teamColor === gameData.teamTurn ? (
                !isSpymaster ? (
                    currentHint ? (
                        // Field operative sees only the hint if it's their team's turn
                        <div className="text-center mt-8">
                          <p className="text-4xl">
                            Hint: <strong>{currentHint.hint}</strong> ({currentHint.wordsCount})
                          </p>
                        </div>
                    ) : (
                        // Field operative sees "waiting for hint" if no hint is available
                        <h1 className="text-4xl font-bold text-white mt-6">
                          Waiting for your Spymaster to give a hint...
                        </h1>
                    )
                ) : (
                    !hintSubmitted ? (
                        // Spymaster sees the input fields to provide a hint
                        <div className="flex flex-col items-center gap-2 mt-6">
                          <p className="text-4xl font-bold mb-4">
                            Your turn! Provide a hint and a number!
                          </p>
                          <div className="flex items-center gap-2 mt-2!">
                            <input
                                type="text"
                                placeholder="Enter a hint"
                                className="bg-[rgba(70,90,110,0.55)] text-white px-4 py-3 rounded w-64 text-lg"
                                value={hintText}
                                onChange={(e) => setHintText(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="# words"
                                className="bg-[rgba(70,90,110,0.55)] text-white px-2 py-3 rounded w-20 text-lg text-center"
                                value={hintNumber}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  if (val >= 0) setHintNumber(val);
                                }}
                                min={0}
                            />
                            <button
                                onClick={sendHint}
                                className="bg-green-600 px-6 py-3 rounded text-lg font-semibold text-white"
                            >
                              Send Hint
                            </button>
                          </div>
                        </div>
                    ) : (
                        // Message displayed after the hint is submitted
                        <p className="text-4xl font-bold text-white mt-6">
                          Hint submitted. Now waiting for the other team’s move...
                        </p>
                    )
                )
            ) : (
                // Opposing team sees "it's the other team's turn"
                <p className="text-4xl font-bold mt-6">
                  It’s the other team’s turn...
                </p>
            )}

            {/* Hint display (always visible to all players except field operative of the active team) */}
            {currentHint && teamColor !== gameData.teamTurn && (
                <div className="text-center mt-6!">
                  <p className="text-3xl">
                    Hint: <strong>{currentHint.hint}</strong> ({currentHint.wordsCount})
                  </p>
                </div>
            )}

            {/* Remaining guesses display */}
            {teamColor === gameData.teamTurn && !isSpymaster && currentHint && (
              <div className="text-center mt-4">
                <p className="text-2xl font-semibold italic ">
                  Remaining attempts: <strong >{remainingGuesses}</strong>
                </p>
                <button
                  onClick={handleEndTurn}
                  className="mt-4 bg-red-600 px-6 py-3 rounded text-lg font-semibold text-white hover:bg-red-700 transition-all"
                >
                  End turn
                </button>
              </div>
            )}
            {gameData.gameMode === "TIMED" && teamColor === gameData.teamTurn && (
                <div className="text-center mt-2 text-2xl text-white font-bold">
                  Time left: <span className="text-yellow-400">{countdown}s</span>
                </div>
            )}
          </div>


          {/* Score display */}
          <div className="flex justify-between items-center w-full px-12 max-w-7xl mx-auto mb-10">
            {/* Blue team */}
            <div
                className="bg-blue-700 h-32 w-40 p-4 rounded-xl flex flex-col justify-center items-center shadow-md border-4 border-blue-400 ml-4!">
  <span className="text-3xl font-bold">
    {(gameData?.board ?? []).filter(card => card.color === 'BLUE' && !card.guessed).length}
  </span>
              <span className="text-2xl font-bold mt-2">Team blue</span>
            </div>


            {/* Red team */}
            <div
                className="bg-red-700 h-32 w-40 p-4 rounded-xl flex flex-col justify-center items-center shadow-md border-4 border-red-400 absolute right-4 ">
    <span className="text-3xl font-bold mt-5">
      {(gameData?.board ?? []).filter(card => card.color === 'RED' && !card.guessed).length}
    </span>
              <span className="text-2xl font-bold mt-2">Team red</span>
            </div>
          </div>


          {/* Game board */}
          <div className="flex justify-center mt-8">
            <div className="grid grid-cols-5 gap-5 max-w-5xl">
              {(gameData?.board ?? []).map((card, index) => {
                const baseStyles =
                    'flex items-center justify-center text-center break-words w-32 sm:w-36 min-h-[120px] px-6 py-4 text-base font-semibold border-4 rounded-2xl shadow-md transition-all duration-200 leading-tight';

                const unguessedStyles = {
                  RED: 'bg-red-600 text-white border-red-800',
                  BLUE: 'bg-blue-600 text-white border-blue-800',
                  NEUTRAL: 'bg-gray-400 text-white border-gray-500',
                  BLACK: 'bg-black text-white border-gray-800',
                };

                const guessedStyle = {
                  RED: 'bg-red-300 text-black border-red-500',
                  BLUE: 'bg-blue-300 text-black border-blue-500',
                  NEUTRAL: 'bg-gray-400 text-black border-gray-500',
                  BLACK: 'bg-black text-white border-gray-700',
                };

                return (
                    <div
                        key={index}
                        onClick={() => {
                          if (
                              !card.guessed &&
                              !isSpymaster &&
                              teamColor === gameData.teamTurn
                          ) {
                            if (!currentHint) {
                              message.warning("Wait for the hint first!");
                              return;
                            }
                            handleGuess(card.word);
                          }
                        }}
                        className={`${baseStyles} ${
                          card.guessed
                              ? guessedStyle[card.color]
                              : `${isSpymaster ? unguessedStyles[card.color].replace(/border-[^\s]+/, '') : 'bg-amber-100 text-black'} ${
                                    card.selected ? 'border-yellow-500' : 'border-gray-500'
                                }`
                        } ${
                            !card.guessed && !isSpymaster && teamColor === gameData.teamTurn
                                ? 'cursor-pointer hover:scale-105'
                                : 'cursor-not-allowed opacity-50'
                        }`}
                        style={{
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                          position: 'relative',
                        }}
                    >
                      {/* Select Button */}
                      {!card.guessed && !isSpymaster && teamColor === gameData.teamTurn && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!currentHint){
                              message.warning("Wait for the hint, before selecting words!"); 
                              return; 
                            }
                            handleSelectedWord(card.word, card.selected);
                          }}
                          className={`absolute top-1 right-1 w-3 h-3 rounded-full cursor-pointer ${
                            card.selected ? 'bg-yellow-500' : 'bg-gray-500'
                          }`}
                        ></div>
                      )}

                      {formatWord(card.word)}
                    </div>
                );
              })}
            </div>
          </div>
        </div>
    );
  };
export default GamePage;
