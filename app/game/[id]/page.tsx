'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import classNames from 'classnames';
import { webSocketService } from '../../api/webSocketService';


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

const GamePage: React.FC = () => {
  const params = useParams();
  const gameId = params.id;
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hintText, setHintText] = useState('');
  const [hintNumber, setHintNumber] = useState(0);
  const [currentHint, setCurrentHint] = useState<{ hint: string; wordsCount: number } | null>(null);

  const ws = new webSocketService();
  const isSpymaster = false; // Set to false to test guesser view
  const teamColor: 'RED' | 'BLUE' = 'BLUE'; //  hardcode for now

  const sendHint = async () => {
    try {
      console.log("sending hint to gameId:", gameId);
      await fetch(`http://localhost:8080/game/${gameId}/hint`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 293a59e7-3b28-4811-8041-ee04ea84c343', // your test token
        },
        body: JSON.stringify({
          hint: hintText,
          wordsCount: hintNumber
        }),
      });
  
      setHintText('');
      setHintNumber(0);
    } catch (err) {
      console.error('Error sending hint:', err);
    }
  };
  

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`http://localhost:8080/game/${gameId}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 293a59e7-3b28-4811-8041-ee04ea84c343',
          },
          body: JSON.stringify({
            startingTeam: 'RED',
            gameMode: 'NORMAL',
            theme: 'default',
          }),
        });

        if (!res.ok) throw new Error(`Error: ${res.statusText}`);
        const data = await res.json();
        setGameData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    // Fetch initial game data and subscribe to updates
    fetchGame().then(async () => {
      try {
        await ws.connect();
        await ws.subscribe(`/topic/game/${gameId}`, (updatedGame: GameData) => {
          console.log("🔁 Received update:", updatedGame);
          setGameData(updatedGame);
        });
        await ws.subscribe(`/topic/game/${gameId}/hint`, (receivedHint: { hint: string; wordsCount: number }) => {
          console.log(" Received hint via WebSocket:", receivedHint);
          setCurrentHint(receivedHint);
        });
      } catch (e) {
        console.error("WebSocket connection failed:", e);
      }
    });

    // Cleanup on unmount
    return () => {
      ws.disconnect();
    };
  }, [gameId]);

  if (loading) return <div className="p-6 text-lg">Loading game...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!gameData) return null;

  return (
  <div
    className="min-h-screen text-white px-4 py-6"
    style={{
      backgroundColor: teamColor === 'BLUE' ? '#5587b2' : '#a44c3e',
    }}
  >
    {/* Turn-based message / hint input */}
    <div className="text-center mb-6">
      {teamColor === gameData.teamTurn ? (
        !isSpymaster ? (
          <h1 className="text-3xl font-bold text-white-300 mt-6">
            Wartet auf den Hinweis von eurem Spymaster...
          </h1>
        ) : (
          <div className="flex flex-col items-center gap-2 mt-6">
            <p className="text-3xl font-bold mb-4">
              Your turn, enter a hint and a number
            </p>
            <div className="flex items-center gap-4 mt-2">
              <input
                type="text"
                placeholder="Enter hint"
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
                Give Hint
              </button>
            </div>
          </div>
        )
      ) : (
        <p className="text-3xl font-bold mt-6">
          Das andere Team ist dran...
        </p>
      )}
    </div>

    {/* Score display */}
    <div className="flex justify-between items-center w-full px-12 max-w-7xl mx-auto mb-10">
      {/* Blue team */}
      <div className="bg-blue-700 p-4 rounded-xl flex flex-col items-center shadow-md w-40 h-30 border-4 border-blue-400">
        <span className="text-2xl font-bold mt-5">
          {gameData.board.filter(card => card.color === 'BLUE' && !card.guessed).length}
        </span>
        <span className="text-2xl font-bold mt-2">Team blau</span>
      </div>

      {/* Red team */}
      <div className="bg-red-700 p-4 rounded-xl flex flex-col items-center shadow-md w-40 h-30 absolute right-4 border-4 border-red-400">
        <span className="text-2xl font-bold mt-5">
          {gameData.board.filter(card => card.color === 'RED' && !card.guessed).length}
        </span>
        <span className="text-2xl font-bold mt-2">Team rot</span>
      </div>
    </div>

    {/* Hint display for guessers */}
    {!isSpymaster && currentHint && (
      <div className="text-center mb-6">
        <p className="text-2xl">
          Hinweis: <strong>{currentHint.hint}</strong> ({currentHint.wordsCount})
        </p>
      </div>
    )}

    {/* Game board */}
    <div className="flex justify-center mt-8">
      <div className="grid grid-cols-5 gap-5 max-w-5xl">
        {gameData.board.map((card, index) => {
          const baseStyles =
            'flex items-center justify-center aspect-square w-24 sm:w-28 text-base sm:text-lg font-semibold border-4 rounded-2xl shadow-md transition-all duration-200';

          const unguessedStyles = {
            RED: 'bg-red-600 text-white border-red-800',
            BLUE: 'bg-blue-600 text-white border-blue-800',
            NEUTRAL: 'bg-gray-400 text-white border-gray-500',
            BLACK: 'bg-black text-white border-gray-800',
          };

          const guessedStyle = 'bg-white text-black border-gray-300';

          return (
            <div
              key={index}
              className={`${baseStyles} ${
                card.guessed
                ? guessedStyle
                : isSpymaster
        ? unguessedStyles[card.color?.toUpperCase() as keyof typeof unguessedStyles]
        :  'bg-amber-100 text-black border-gray-500'
      }`}
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
