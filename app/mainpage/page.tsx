'use client';

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from 'next/navigation';
import { Button, Input, App } from 'antd';
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

  // Funktion, um einer offenen Lobby beizutreten
 // Funktion, um einer offenen Lobby beizutreten
 const fetchOpenLobby = async () => {
   try {
     const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
     const playerId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

     if (!token || !playerId) {
       router.replace("/?message=Please login first.");
       return;
     }

     // Anfrage nach einer offenen Lobby
     const response = await apiService.get<LobbyResponseDTO>(
       "/lobby/lost", // Hier die Anfrage nach einer offenen Lobby
       { Authorization: `Bearer ${token}` }
     );

     // Überprüfen, ob eine offene Lobby zurückgegeben wurde
     if (!response || !response.id) {
       message.info("There's currently no Open Lobby. Feel free to create a new one.");
       return; // Es existiert keine offene Lobby, keine Aktion wird durchgeführt
     }

     // Wenn eine offene Lobby existiert, dann tritt dem Lobby bei
     const lobby = response;

     // Hier verwenden wir die lobbyId korrekt, statt des lobbyCodes
     await apiService.put<PlayerResponseDTO>(
       `/lobby/${lobby.id}/${playerId}`, // Verwende die lobbyId hier
       null,
       { Authorization: `Bearer ${token}` }
     );

     // Speichern der Lobby-Informationen
     setLobbyId(String(lobby.id));
     localStorage.setItem("lobbyCode", String(lobby.lobbyCode));

     // Setze den Spielerstatus auf "nicht bereit"
     await apiService.put<ReadyStatusDTO>(
       `/lobby/${lobby.id}/status/${playerId}`,
       { ready: false },
       { Authorization: `Bearer ${token}` }
     );

     // Weiterleitung zur Lobby-Seite
     window.location.href = `/lobby/${lobby.id}`;
   } catch (error: any) {
     if (
      error?.response?.status === 404 || 
      error?.status === 404 ||         
      error?.message?.includes("not found")
    ) {
      message.info("There's currently no Open Lobby. Feel free to create a new one.");
    } else {
      console.error("Error while joining the Open Lobby", error);
      message.error("Couldn't find or join the Open Lobby.");
    }
  }
 };

  // Funktion für Beitritt oder Erstellung einer Lobby
  const handleJoinOrCreateLobby = async () => {
    try {
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      const userId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

      if (!token || !userId) {
        router.replace("/?message=Please login first.");
        return;
      }

      let lobby: LobbyResponseDTO;

      if (lobbyCode.trim()) {
        const response = await apiService.get<LobbyResponseDTO>(
          `/lobby?code=${parseInt(lobbyCode)}&autoCreate=false`,
          { Authorization: `Bearer ${token}` }
        );
        lobby = response;
      }

      // Fall: Neue Lobby erstellen
      else {
        const response = await apiService.get<{ data: LobbyResponseDTO }>(
          "/lobby",
          { Authorization: `Bearer ${token}` }
        );
        lobby = response.data ?? response;
      }

      if (!lobby || !lobby.id) throw new Error("Lobby could not be loaded.");

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
      const errorMessage = error?.response?.data?.message || error?.message || "";

      if (
        error?.status === 400 ||
        errorMessage.toLowerCase().includes("lobby with code")
      ) {
        message.error("Invalid lobby code. Please check your input.");
      } else if (
        errorMessage.toLowerCase().includes("game has already started") ||
        errorMessage.toLowerCase().includes("cannot join")
      ) {
        message.info("You can't join this lobby because the game has already started.");
      } else {
        console.error("Join/Create lobby error:", error);
        message.error("Could not join or create the lobby.");
      }
    }
  };

  const handleCodeChange = (value: string) => {
    setLobbyCode(value);
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

      <div className="w-full max-w-sm mb-3!">
        <Input
          placeholder="Enter Lobby Code (optional)"
          value={lobbyCode}
          onChange={(e) => handleCodeChange(e.target.value)}
          size="large"
        />
      </div>
        <div className="flex flex-col items-center gap-3! w-full max-w-xs">
        <Button
          type="default"
          size="middle"
          style={{ width: 250 }}
          onClick={handleJoinOrCreateLobby}
        >
          {lobbyCode.trim() ? "Join Lobby" : "Create Lobby"}
        </Button>
        <Button
          type="default"
          size="middle"
          style={{ width: 250 }}
          onClick={fetchOpenLobby} // Button zum Beitreten einer offenen Lobby
        >
          Join Open Lobby
        </Button>
        <Button
          type="default"
          size="middle"
          style={{ width: 250 }}
          onClick={() => router.push('/users')}
        >
          View all users
        </Button>
        <Button
          type="default"
          size="middle"
          style={{ width: 250 }}
          onClick={() => router.push('/rules')}
        >
        Game Rules
        </Button>
      </div>
    </div>
  );
}