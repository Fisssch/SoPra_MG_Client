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
};

type GameData = {
    id: number;
    board: Card[];
    teamTurn: 'RED' | 'BLUE';
    status: string;
    startingTeam: 'RED' | 'BLUE';
    winningTeam: string | null;
    gameMode: string;
};

type makeGuessDTO = {
    teamColor: 'RED' | 'BLUE';
    word: string;
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

  const ws = useRef(new webSocketService()).current;
  const initializedRef = useRef(false);

  const [isSpymaster, setIsSpymaster] = useState(false);
  const [teamColor, setTeamColor] = useState<'RED' | 'BLUE'>('RED');
  const [hintSubmitted, setHintSubmitted] = useState(false);

  const clearGameLocalStorage = (gameId: string) => {
    localStorage.removeItem(`currentHint_${gameId}`);
    localStorage.removeItem(`hintSubmitted_${gameId}_RED`);
    localStorage.removeItem(`hintSubmitted_${gameId}_BLUE`);
    localStorage.removeItem(`gameStartedOnce_${gameId}`);
    localStorage.removeItem("playerTeam");
    localStorage.removeItem("isSpymaster");
    localStorage.removeItem("gameMode");
    localStorage.removeItem("startingTeam");
  };

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
      console.error('Error sending hint:', err);
    
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
    
        if (status === 400 && messageText.includes("Hint cannot be empty")) {
          message.error("Hinweis darf nicht leer sein und nur ein Wort enthalten.");
          return;
        }
      }
    
      message.error("Hinweis konnte nicht gesendet werden.");
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
        //get gamemode & startingteam first
        const storedGameMode = localStorage.getItem('gameMode') ?? 'CLASSIC';
        const storedStartingTeam = (localStorage.getItem('startingTeam')?.toUpperCase() || 'RED') as 'RED' | 'BLUE';

        const res = await apiService.post(`/game/${gameId}/start`, {
          startingTeam: storedStartingTeam,
          gameMode: storedGameMode.toUpperCase()
        }, {
          'Authorization': `Bearer ${token}`,

        });

        setGameData(res.data as GameData);
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
        await ws.subscribe(`/topic/game/${gameId}/board`, (updatedBoard: Card[]) => {
          setGameData((prev) => prev ? { ...prev, board: updatedBoard } : prev);
        });

        // Subscribe to hint updates
        await ws.subscribe(`/topic/game/${gameId}/hint`, (hint) => {
          setCurrentHint(hint);
          localStorage.setItem(`currentHint_${gameId}`, JSON.stringify(hint));
        });

        // Subscribe to guess updates
        await ws.subscribe(`/topic/game/${gameId}/guess`, (guess: makeGuessDTO) => {
          setGameData((prev) => prev ? { ...prev, teamTurn: guess.teamColor } : prev);
        });

        // Subscribe to game completion
        await ws.subscribe(`/topic/game/${gameId}/gameCompleted`, (winningTeam: string) => {
          localStorage.setItem("winningTeam", winningTeam);
          clearGameLocalStorage(gameId);
          router.replace(`/result/${gameId}`);
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
        <div
            className="min-h-screen text-white px-4 py-6 "
            style={{
              backgroundColor: teamColor === 'BLUE' ? '#5587b2' : '#a44c3e',
            }}
        >
          {/* Turn-based message / hint input */}
          <div className="text-center mb-6 mt-6 pt-5!">
            {/* Turn-based message */}
            {teamColor === gameData.teamTurn ? (
                !isSpymaster ? (
                    currentHint ? (
                        // Field operative sees only the hint if it's their team's turn
                        <div className="text-center mt-8">
                          <p className="text-4xl">
                            Hinweis: <strong>{currentHint.hint}</strong> ({currentHint.wordsCount})
                          </p>
                        </div>
                    ) : (
                        // Field operative sees "waiting for hint" if no hint is available
                        <h1 className="text-4xl font-bold text-white mt-6">
                          Wartet auf den Hinweis von eurem Spymaster...
                        </h1>
                    )
                ) : (
                    !hintSubmitted ? (
                        // Spymaster sees the input fields to provide a hint
                        <div className="flex flex-col items-center gap-2 mt-6">
                          <p className="text-4xl font-bold mb-4">
                            Du bist dran, gib ein Hinweis und eine Zahl an!
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <input
                                type="text"
                                placeholder="Gib einen Hinweis ein"
                                className="text-black px-4 py-3 rounded w-64 text-lg"
                                value={hintText}
                                onChange={(e) => setHintText(e.target.value)}
                            />
                            <input
                                type="number"
                                placeholder="# words"
                                className="text-black px-2 py-3 rounded w-20 text-lg text-center"
                                value={hintNumber}
                                onChange={(e) => setHintNumber(Number(e.target.value))}
                            />
                            <button
                                onClick={sendHint}
                                className="bg-green-600 px-6 py-3 rounded text-lg font-semibold text-white"
                            >
                              Hinweis absenden
                            </button>
                          </div>
                        </div>
                    ) : (
                        // Message displayed after the hint is submitted
                        <p className="text-4xl font-bold text-white mt-6">
                          Hinweis abgegeben! Warte auf die Reaktion des anderen Teams...
                        </p>
                    )
                )
            ) : (
                // Opposing team sees "it's the other team's turn"
                <p className="text-4xl font-bold mt-6">
                  Das andere Team ist dran...
                </p>
            )}

            {/* Hint display (always visible to all players except field operative of the active team) */}
            {currentHint && teamColor !== gameData.teamTurn && (
                <div className="text-center mt-6!">
                  <p className="text-3xl">
                    Hinweis: <strong>{currentHint.hint}</strong> ({currentHint.wordsCount})
                  </p>
                </div>
            )}
          </div>


          {/* Score display */}
          <div className="flex justify-between items-center w-full px-12 max-w-7xl mx-auto mb-10">
            {/* Blue team */}
            <div
                className="bg-blue-700 h-32 w-40 p-4 rounded-xl flex flex-col justify-center items-center shadow-md border-4 border-blue-400 ml-4!">
  <span className="text-3xl font-bold">
    {gameData.board.filter(card => card.color === 'BLUE' && !card.guessed).length}
  </span>
              <span className="text-2xl font-bold mt-2">Team blau</span>
            </div>


            {/* Red team */}
            <div
                className="bg-red-700 h-32 w-40 p-4 rounded-xl flex flex-col justify-center items-center shadow-md border-4 border-red-400 absolute right-4 ">
    <span className="text-3xl font-bold mt-5">
      {gameData.board.filter(card => card.color === 'RED' && !card.guessed).length}
    </span>
              <span className="text-2xl font-bold mt-2">Team rot</span>
            </div>
          </div>


          {/* Game board */}
          <div className="flex justify-center mt-8">
            <div className="grid grid-cols-5 gap-5 max-w-5xl">
              {gameData.board.map((card, index) => {
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
                  NEUTRAL: 'bg-gray-200 text-black border-gray-400',
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
                              alert("Warte zuerst auf den Hinweis!");
                              return;
                            }
                            handleGuess(card.word);
                          }
                        }}
                        className={`${baseStyles} ${
                            card.guessed
                                ? guessedStyle[card.color]
                                : isSpymaster
                                    ? unguessedStyles[card.color]
                                    : 'bg-amber-100 text-black border-gray-500'
                        } ${
                            !card.guessed && !isSpymaster && teamColor === gameData.teamTurn
                                ? 'cursor-pointer hover:scale-105'
                                : 'cursor-not-allowed opacity-50'
                        }`}
                        style={{
                          overflowWrap: 'break-word',
                          wordBreak: 'break-word',
                          textAlign: 'center',
                        }}
                    >
                      {card.word}
                    </div>
                );
              })}
            </div>
          </div>
        </div>
    );
  };
export default GamePage;
