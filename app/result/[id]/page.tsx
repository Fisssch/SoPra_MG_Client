"use client"

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import {useEffect, useState} from "react";
import { useApi } from '@/hooks/useApi';



export default function Result() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [winningTeam, setWinningTeam] = useState<string | null>(null);
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

    }, []);

    if (authorized === null) {
        return null;
    }

    const handleLeaveLobbyAndGoHome = async () => {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        const lobbyId = localStorage.getItem("lobbyId")?.replace(/^"|"$/g, "");
        const playerId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

        console.log("HELLO1")
        if (token && lobbyId && playerId) {
            console.log("HELLO2");
            try {
                await apiService.delete(`/lobby/${lobbyId}/${playerId}`, {
                    Authorization: `Bearer ${token}`,
                  });
                console.log("Spieler aus der Lobby entfernt.");
            } catch (error) {
                console.warn("Konnte Spieler nicht aus der Lobby entfernen (vielleicht war er schon raus):", error);
            }
        }

        const keysToRemove = [
            "lobbyId",
            "playerId",
            "winningTeam",
        ];

        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("hintSubmitted_")) {
                localStorage.removeItem(key);
            }
        });

        keysToRemove.forEach((key) => localStorage.removeItem(key));

        router.push("/mainpage");
    };

    const handleBackToLobby = () => {
        const lobbyId = localStorage.getItem("lobbyId")?.replace(/^"|"$/g, "");
        if (lobbyId) {
            router.push(`/lobby/${lobbyId}`);
        } else {
            alert("Lobby not found.");
        }
    };

    return (
        <div className="min-h-screen bg-[#a34d3f] text-white relative flex flex-col items-center px-4 pt-16">

            <h1 className="text-8xl font-extrabold mt-32! mb-32!">
                Team {winningTeam ? winningTeam.charAt(0).toUpperCase() + winningTeam.slice(1).toLowerCase() : ""} has won!
            </h1>

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