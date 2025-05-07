"use client"

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import { useEffect, useState } from "react";
import { useApi } from '@/hooks/useApi';

type Card = {
    word: string;
    color: 'RED' | 'BLUE' | 'NEUTRAL' | 'BLACK';
    guessed: boolean;
    selected: boolean;
};

export default function Result() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [winningTeam, setWinningTeam] = useState<string | null>(null);
    const [board, setBoard] = useState<Card[] | null>(null);
    const apiService = useApi();

    useEffect(() => {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) {
            router.replace("/message=Please login first.");
        } else {
            setAuthorized(true);
        }
        //getting winning team and lobby id
        const storedWinningTeam = localStorage.getItem("winningTeam");
        if (storedWinningTeam) setWinningTeam(storedWinningTeam);

        const lobbyId = localStorage.getItem("lobbyId")?.replace(/^"|"$/g, "");
        if (lobbyId) {
            const storedBoard = localStorage.getItem(`gameBoard_${lobbyId}`);
            if (storedBoard) {
                try {
                    const parsedBoard = JSON.parse(storedBoard);
                    setBoard(parsedBoard);
                } catch (e) {
                    console.error("Fehler beim Parsen des gespeicherten Boards:", e);
                }
            }
        }
    }, []);

    if (authorized === null) {
        return null;
    }

    const handleLeaveLobbyAndGoHome = async () => {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        const lobbyId = localStorage.getItem("lobbyId")?.replace(/^"|"$/g, "");
        const playerId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

        if (token && lobbyId && playerId) {
            try {
                await apiService.delete(`/lobby/${lobbyId}/${playerId}`, {
                    Authorization: `Bearer ${token}`,
                });
                console.log("Spieler aus der Lobby entfernt.");
            } catch (error) {
                console.warn("Konnte Spieler nicht aus der Lobby entfernen:", error);
            }
        }

        const keysToRemove = [
            `gameBoard_${lobbyId}`,
            "lobbyId",
            "playerId",
            "winningTeam",

    ];

        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("hintSubmitted_") || key.startsWith("currentHint_") || key.startsWith("remainingGuesses_") || key.startsWith("gameBoard_")) {
                localStorage.removeItem(key);
            }
        });

        keysToRemove.forEach((key) => localStorage.removeItem(key));

        router.push("/mainpage");
    };

    const handleBackToLobby = () => {
        const lobbyId = localStorage.getItem("lobbyId")?.replace(/^"|"$/g, "");
        if (lobbyId) {
            window.location.href = `/lobby/${lobbyId}`;
        } else {
            alert("Lobby not found.");
        }
    };

    return (
        <div
            className="h-screen flex flex-col items-center justify-center text-white text-center px-4"
            style={{
                background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)'
            }}
        >
            <h1
                className="text-7xl font-extrabold mt-2! mb-2!"
                style={{
                    color: 'white',
                    WebkitTextStroke: '2px transparent',
                    background: 'linear-gradient(to right, #00b4d8, #ff1e00)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'white',
                }}
            >
                Team {winningTeam ? winningTeam.charAt(0).toUpperCase() + winningTeam.slice(1).toLowerCase() : ""} has won!
            </h1>

            {board && (
                <div className="mt-6! mb-6! w-full flex justify-center">
                    <div
                         className="p-4! rounded-2xl shadow-lg bg-opacity-40"
                        style={{ backgroundColor: "rgba(31, 41, 55, 0.3)" }}
                    >
                        <h2 className="text-4xl font-bold mb-5! text-white text-center">Board</h2>
                        <div className="grid grid-cols-5 gap-x-2 gap-y-2 max-w-fit mx-auto">
                            {board.map((card, index) => {
                                const unguessedStyles = {
                                    RED: 'bg-red-600 text-white border-2 border-white',
                                    BLUE: 'bg-blue-600 bg-opacity-70 text-white border-2 border-white',
                                    NEUTRAL: 'bg-gray-400 bg-opacity-70 text-white border-2 border-white',
                                    BLACK: 'bg-black bg-opacity-70 text-white border-2 border-white',
                                };

                                const guessedStyles = {
                                    RED: 'bg-red-300 bg-opacity-60 text-black border-4 border-red-500',
                                    BLUE: 'bg-blue-300 bg-opacity-60 text-black border-4 border-blue-500',
                                    NEUTRAL: 'bg-gray-200 bg-opacity-60 text-black border-4 border-gray-400',
                                    BLACK: 'bg-black bg-opacity-60 text-white border-4 border-gray-700',
                                };

                                const cardStyle = card.guessed
                                    ? guessedStyles[card.color]
                                    : unguessedStyles[card.color];

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-xl p-4 text-center font-semibold w-24 h-15 flex items-center justify-center ${cardStyle}`}
                                    >
                                        {card.word.charAt(0).toUpperCase() + card.word.slice(1).toLowerCase()}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <div className="flex gap-6">
                <Button
                    type="default"
                    size="large"
                    className="bg-white text-black font-medium rounded-md px-6 py-2"
                    onClick={handleBackToLobby}
                >
                    Back to Lobby
                </Button>

                <Button
                    type="primary"
                    size="large"
                    onClick={handleLeaveLobbyAndGoHome}
                >
                    Back to Mainpage
                </Button>
            </div>
        </div>
    );
}