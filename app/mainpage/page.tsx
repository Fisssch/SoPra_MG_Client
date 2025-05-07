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

  // Funktion, um einer offenen Lobby beizutreten
  const fetchOpenLobby = async () => {
    try {
      const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
      if (!token) {
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
        message.info("Es existiert keine offene Lobby. Du kannst eine neue Lobby erstellen.");
        return; // Es existiert keine offene Lobby, keine Aktion wird durchgeführt
      }

      // Wenn eine offene Lobby existiert, dann tritt dem Lobby bei
      const lobby = response;

      // Wichtig: Entferne die URL-Kodierung für die playerId
      await apiService.put<PlayerResponseDTO>(
        `/lobby/${lobby.lobbyCode}/${localStorage.getItem("id")}`, // Verwende die lobbyCode und playerId ohne URL-Kodierung
        null,
        { Authorization: `Bearer ${token}` }
      );

      // Speichern der Lobby-Informationen
      setLobbyId(String(lobby.id));
      localStorage.setItem("lobbyCode", String(lobby.lobbyCode));

      // Setze den Spielerstatus auf "nicht bereit"
      await apiService.put<ReadyStatusDTO>(
        `/lobby/${lobby.id}/status/${localStorage.getItem("id")}`,
        { ready: false },
        { Authorization: `Bearer ${token}` }
      );

      // Weiterleitung zur Lobby-Seite
      window.location.href = `/lobby/${lobby.id}`;
    } catch (error: any) {
      console.error("Fehler beim Beitreten der offenen Lobby:", error);
      message.error("Konnte keine offene Lobby finden oder beitreten.");
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

      <div className="flex gap-6 mt-6">
        <Button
          type="default"
          size="large"
          className="bg-white text-black font-medium rounded-md px-6 py-2"
          onClick={handleJoinOrCreateLobby}
        >
          {lobbyCode.trim() ? "Join Lobby" : "Create Lobby"}
        </Button>
        <Button
          type="default"
          size="large"
          className="bg-white text-black font-medium rounded-md px-6 py-2"
          onClick={fetchOpenLobby} // Button zum Beitreten einer offenen Lobby
        >
          Join Open Lobby
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