'use client';

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from 'next/navigation';
import { Button, Input, Checkbox, App } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";

interface LobbyResponseDTO {
  id: number;
  lobbyName: string;
  gameMode: string;
  lobbyCode: number;
  openForLostPlayers: boolean;
}
interface PlayerResponseDTO {
  id: number;
  role: string;
  teamColor: string;
  ready: boolean;
}
interface ReadyStatusDTO {
  ready: boolean;
}

export default function Home() {
  const router = useRouter();
  const apiService = useApi();
  const { message } = App.useApp();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [lobbyCode, setLobbyCode] = useState<string>("");
  const [joinOpenLobby, setJoinOpenLobby] = useState(false);
  const [allowLostPlayers, setAllowLostPlayers] = useState(false);

  const { set: setLobbyId } = useLocalStorage<string>("lobbyId", "");

  useEffect(() => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    if (!token) {
      router.replace("/?message=Please login first.");
    } else {
      setAuthorized(true);
    }
  }, []);

  if (authorized === null) return null;

  const handleJoinOrCreateLobby = async () => {
    try {
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      const userId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

      if (!token || !userId) {
        router.replace("/?message=Please login first.");
        return;
      }

      let lobby: LobbyResponseDTO;

      // Case 1: Join offene Lobby (verlorene Spieler)
      if (joinOpenLobby && !lobbyCode.trim()) {
        const response = await apiService.get<{ data: LobbyResponseDTO }>("/lobby/lost", {
          Authorization: `Bearer ${token}`,
        });
        lobby = response.data ?? response;
      }

      // Case 2: Join via Code
      else if (lobbyCode.trim()) {
        const response = await apiService.get<LobbyResponseDTO>(
          `/lobby?code=${parseInt(lobbyCode)}&autoCreate=false`,
          { Authorization: `Bearer ${token}` }
        );
        lobby = response;
      }

      // Case 3: Create Lobby
      else {
        const response = await apiService.post<{ data: LobbyResponseDTO }>(
          "/lobby",
          {
            lobbyName: `Lobby ${Math.floor(Math.random() * 1000)}`,
            gameMode: "classic",
            openForLostPlayers: allowLostPlayers,
          },
          { Authorization: `Bearer ${token}` }
        );
        lobby = response.data ?? response;
      }

      if (!lobby || !lobby.id) throw new Error("Lobby konnte nicht geladen werden.");

      await apiService.put<PlayerResponseDTO>(
        `/lobby/${lobby.id}/${userId}`,
        null,
        { Authorization: `Bearer ${token}` }
      );

      setLobbyId(String(lobby.id));
      localStorage.setItem("lobbyCode", String(lobby.lobbyCode));

      await apiService.put<ReadyStatusDTO>(
        `/lobby/${lobby.id}/status/${userId}`,
        { ready: false },
        { Authorization: `Bearer ${token}` }
      );

      window.location.href = `/lobby/${lobby.id}`;
    } catch (error: any) {
      console.error("Join/Create lobby error:", error);

      if (error?.status === 400 || error?.message?.includes("Lobby with code")) {
        message.error("Ungültiger Lobby-Code. Bitte überprüfe deine Eingabe.");
      } else {
        message.error("Konnte der Lobby nicht beitreten oder sie erstellen.");
      }
    }
  };

  const handleCodeChange = (value: string) => {
    setLobbyCode(value);
    if (value.trim() !== "") {
      setJoinOpenLobby(false);
      setAllowLostPlayers(false);
    }
  };

  return (
    <div
      className="h-screen flex flex-col items-center justify-center text-white text-center px-4"
      style={{
        background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)'
      }}
    >
      <div className="absolute top-4 right-4">
        <Button
          shape="circle"
          icon={<UserOutlined />}
          size="large"
          onClick={() => router.push('/profile')}
        />
      </div>

      <h1
        className="text-8xl font-bold mt-[50px] text-center mb-5!"
        style={{
          color: 'white',
          WebkitTextStroke: '2px transparent',
          background: 'linear-gradient(to right, #00b4d8, #ff1e00)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'white',
        }}
      >
        Codenames+
      </h1>

      <div className="w-full max-w-sm mb-4">
        <Input
          placeholder="Enter Lobby Code (optional)"
          value={lobbyCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          size="large"
        />
      </div>

      {lobbyCode.trim() === "" && (
        <div className="w-full max-w-sm flex flex-col gap-2 text-left text-white">
          {!allowLostPlayers && (
            <Checkbox
              checked={joinOpenLobby}
              onChange={() => {
                setJoinOpenLobby(!joinOpenLobby);
                setAllowLostPlayers(false);
              }}
            >
              Join game without a code
            </Checkbox>
          )}
          {!joinOpenLobby && (
            <Checkbox
              checked={allowLostPlayers}
              onChange={() => {
                setAllowLostPlayers(!allowLostPlayers);
                setJoinOpenLobby(false);
              }}
            >
              Allow to join Lobby without Code
            </Checkbox>
          )}
        </div>
      )}

      <div className="flex gap-6 mt-6">
        <Button
          type="default"
          size="large"
          className="bg-white text-black font-medium rounded-md px-6 py-2"
          onClick={handleJoinOrCreateLobby}
        >
          {lobbyCode.trim()
            ? "Join Lobby"
            : joinOpenLobby
            ? "Join offene Lobby"
            : "Create Lobby"}
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