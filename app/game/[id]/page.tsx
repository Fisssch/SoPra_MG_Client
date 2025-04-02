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
  const ws = new webSocketService();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const res = await fetch(`http://localhost:8080/game/${gameId}/start`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer f4fe0a69-56a5-4cb6-820d-3a46e5112a3e',
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
    <div className="min-h-screen bg-[#a44c3e] text-white px-4! py-6!">
      {/* Turn indicator */}
      <div className="text-center mb-6">
        <h1 className="text-5xl font-bold">
          {gameData.teamTurn === 'RED'
            ? 'Das rote Team ist dran...'
            : 'Das blaue Team ist dran...'}
        </h1>
      </div>

      {/* Score display */}
      <div className="flex justify-between items-center w-full px-12 max-w-7xl mx-auto mb-10">
        {/* Blue team */}
        <div className="bg-blue-700 p-4 rounded-xl flex flex-col items-center shadow-md w-40 h-30 border-4 border-blue-400">
          <span className="text-2xl font-bold mt-5!">
            {gameData.board.filter(card => card.color === 'BLUE' && !card.guessed).length}
          </span>
          <span className="text-2xl fond-bold mt-2!">Team blau</span>
        </div>

        {/* Red team */}
        <div className="bg-red-700 p-4 rounded-xl flex flex-col items-center shadow-md w-40 h-30 absolute right-4 border-4 border-red-400">
          <span className="text-2xl font-bold mt-5!">
            {gameData.board.filter(card => card.color === 'RED' && !card.guessed).length}
          </span>
          <span className="text-2xl font-bold mt-2!">Team rot</span>
        </div>
      </div>

      {/* Game board */}
      <div className="flex justify-center mt-8!">
        <div className="grid grid-cols-5 gap-5 max-w-5xl">
          {gameData.board.map((card, index) => {
             console.log(card);
            const baseStyles =
              'flex items-center justify-center h-24 sm:h-28 text-base sm:text-lg font-semibold border-4 rounded-2xl shadow-md transition-all duration-200';

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
                  : unguessedStyles[card.color?.toUpperCase() as keyof typeof unguessedStyles] || 'bg-gray-300'
      
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
