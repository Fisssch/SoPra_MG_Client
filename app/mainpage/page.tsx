'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import {useEffect, useState} from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

interface LobbyResponseDTO {
    id: number;
    lobbyName: string;
    gameMode: string;
}
interface PlayerResponseDTO {
    id: number;
    role: string;
    teamColor: string;
    ready: boolean;
}
interface ReadyStatusDTO{
    ready: boolean;
}

export default function Home() {
    const router = useRouter();
    const apiService = useApi();
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const { set: setLobbyId } = useLocalStorage<string>("lobbyId", "");

    useEffect(() => {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) {
            router.replace("/?message=Please login first.");
        } else {
            setAuthorized(true);
        }
    }, []);

    if (authorized === null) {
        return null;
    }

    const handleJoinLobby = async () => {
        try {
            const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
            const userId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

            if (!token || !userId) {
                router.replace("/?message=Please login first.");
                return;
            }

            //if a lobby exist join that lobby or join a new lobby
            const lobby = await apiService.get<LobbyResponseDTO>("/lobby", {
                Authorization: `Bearer ${token}`,
            });

            if (!userId || userId === "null") {
                alert("Invalid User-ID!");
                return;
            }

            //puts player into the lobby
            await apiService.put<PlayerResponseDTO>(
                `/lobby/${lobby.id}/${userId}`,
                null,
                {
                    Authorization: `Bearer ${token}`,
                }
            );

            //saves the lobby lokally
            setLobbyId(String(lobby.id));

            //puts a ready status false when joining the lobby
            await apiService.put<ReadyStatusDTO>(
                `/lobby/${lobby.id}/status/${userId}`,
                { ready: false },
                { Authorization: `Bearer ${token}` }
            );

            router.push(`/lobby/${lobby.id}`);
        } catch (error: any) {
            console.error("Join lobby error:", error);
            alert("Error during joining lobby");
        }
    };

    return (
        <div className="min-h-screen bg-[#a34d3f] text-white relative flex flex-col items-center px-4 pt-16">
            {/* Profil-Icon oben rechts */}
            <div className="absolute top-4 right-4">
                <Button
                    shape="circle"
                    icon={<UserOutlined />}
                    size="large"
                    onClick={() => router.push('/profile')}
                />
            </div>

            <h1 className="text-8xl font-extrabold mt-32! mb-32!">Codenames+</h1>

            <div className="flex gap-6">
                <Button
                    type="default"
                    size="large"
                    className="bg-white text-black font-medium rounded-md px-6 py-2"
                    onClick={handleJoinLobby}
                >
                    Join Lobby
                </Button>
                <Button
                    type="default"
                    size="large"
                    className="bg-white text-black font-medium rounded-md px-6 py-2"
                    onClick={() => router.push('/users')}
                >
                    View all users
                </Button>
            </div>
        </div>
    );
}
