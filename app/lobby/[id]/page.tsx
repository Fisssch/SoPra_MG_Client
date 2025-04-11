'use client';

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Button, Card, Modal, message } from 'antd';
import { webSocketService } from '@/api/webSocketService';
import { CopyOutlined } from '@ant-design/icons';

interface PlayerRoleDTO {
  role: string;
}
interface PlayerTeamDTO {
  color: string;
}
interface ReadyStatusDTO {
  ready: boolean;
}
interface LobbyInfoDTO {
  id: number;
  lobbyName: string;
  gameMode: string;
  lobbyCode: number;
}
interface LobbyPlayerStatusDTO {
  totalPlayers: number;
  readyPlayers: number;
}

export default function LobbyPage() {
  const router = useRouter();
  const { id } = useParams();
  const apiService = useApi();

  const [role, setRole] = useState<string | null>(null);
  const [teamColor, setTeamColor] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [lobbyCode, setLobbyCode] = useState<number | null>(null);
  const [gameMode, setGameMode] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
  const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);

  const [totalPlayers, setTotalPlayers] = useState<number>(0);
  const [readyPlayers, setReadyPlayers] = useState<number>(0);

  const [customWords, setCustomWords] = useState<string[]>([]); 
  const [newCustomWord, setNewCustomWord] = useState<string>('');

  const wsS = new webSocketService();

  //load token and id safely if not in a use effect we get an error when reloading the page 
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem("token")?.replace(/^"|"$/g, "") ?? null);
      setUserId(localStorage.getItem("id")?.replace(/^"|"$/g, "") ?? null);
    }
  }, []);

  useEffect(() => {
    if (!token || !userId || !id) return;
    const fetchPlayerInfo = async () => {
      if (!token || !userId || !id) {
        router.replace('/?message=Missing session data');
        return;
      }

      try {
        const roleRes = await apiService.get<PlayerRoleDTO>(
          `/lobby/${id}/role/${userId}`,
          { Authorization: `Bearer ${token}` }
        );
        setRole(roleRes.role);
        localStorage.setItem("isSpymaster", String(roleRes.role === "SPYMASTER"));

        const teamRes = await apiService.get<PlayerTeamDTO>(
          `/lobby/${id}/team/${userId}`,
          { Authorization: `Bearer ${token}` }
        );
        const usersTeam = teamRes.color.toLowerCase();
        setTeamColor(usersTeam);
        localStorage.setItem("playerTeam", usersTeam);

        const readyRes = await apiService.get<ReadyStatusDTO>(
          `/lobby/${id}/status/${userId}`,
          { Authorization: `Bearer ${token}` }
        );
        setReady(readyRes.ready);

        const lobbyInfo = await apiService.get<LobbyInfoDTO>(
          `/lobby/${id}`,
          { Authorization: `Bearer ${token}` }
        );
        setLobbyCode(lobbyInfo.lobbyCode);
        localStorage.setItem("lobbyCode", lobbyInfo.lobbyCode.toString());
        setGameMode(lobbyInfo.gameMode);

        const statusRes = await apiService.get<LobbyPlayerStatusDTO>(
            `/lobby/${id}/players/status`,
            { Authorization: `Bearer ${token}` }
        );
        setTotalPlayers(statusRes.totalPlayers);
        setReadyPlayers(statusRes.readyPlayers);

        const existingWords = await apiService.get<string[]>(`/lobby/${id}/customWords`, {
          Authorization: `Bearer ${token}`
        });
        setCustomWords(existingWords);

      } catch (error) {
        console.error("Error loading player info:", error);
        alert("Player info could not be loaded.");
      }
    };

    fetchPlayerInfo();
  }, [id, token, userId]);

  useEffect(() => {
    (async () => {
      try {
        await wsS.connect();

        // Ready/Start
        try {
          await wsS.subscribe(`/topic/lobby/${id}/start`, (shouldStart: boolean) => {
            if (shouldStart) {
              router.push(`/game/${id}`);
            }
          });
        } catch (startErr) {
          console.error("WebSocket error during start:", startErr);
        }

        // GameMode
        try {
          await wsS.subscribe(`/topic/lobby/${id}/gameMode`, (lobbyDto: LobbyInfoDTO) => {
            setGameMode(lobbyDto.gameMode);           // global
            setSelectedGameMode(lobbyDto.gameMode);   // lokal
          });
        } catch (modeErr) {
          console.error("WebSocket error in gamemode:", modeErr);
        }

        //number of player
        try{
          await wsS.subscribe(`/topic/lobby/${id}/playerStatus`, (status: LobbyPlayerStatusDTO) => {
            setTotalPlayers(status.totalPlayers);
            setReadyPlayers(status.readyPlayers);
          });
          } catch (countErr) {
            console.error("WebSocket error with count of players:", countErr);
          }

        //own words 
        await wsS.subscribe(`/topic/lobby/${id}/customWords`, (updatedCustomWords: string[]) => {
          console.log("Custom words updated:", updatedCustomWords);
          setCustomWords(updatedCustomWords);
        });

      } catch (connectionErr) {
        console.error("WebSocket was not able to connect:", connectionErr);
      }
    })();

    return () => {
      wsS.disconnect();
    };
  }, [id]);

  const handleReadyToggle = async () => {
    try {
      const newReady = !ready;
      await apiService.put<ReadyStatusDTO>(
        `/lobby/${id}/status/${userId}`,
        { ready: newReady },
        { Authorization: `Bearer ${token}` }
      );
      setReady(newReady);
    } catch (error) {
      console.error("Ready toggle failed:", error);
      alert("Ready status could not be changed.");
    }
  };

  const handleRoleChange = async () => {
    if (selectedRole && selectedRole !== role) {
      try {
        await apiService.put(`/lobby/${id}/role/${userId}`, { role: selectedRole }, {
          Authorization: `Bearer ${token}`
        });
        setRole(selectedRole);
        localStorage.setItem("isSpymaster", String(selectedRole === "SPYMASTER"));
      } catch (error) {
        console.error("Error changing role:", error);
      }
    }
    setIsRoleModalOpen(false);
  };

  const handleTeamChange = async () => {
    if (selectedTeam && selectedTeam !== teamColor) {
      try {
        await apiService.put(`/lobby/${id}/team/${userId}`, { color: selectedTeam }, {
          Authorization: `Bearer ${token}`
        });
        setTeamColor(selectedTeam);
        localStorage.setItem("playerTeam", selectedTeam);
      } catch (error) {
        console.error("Error changing team:", error);
      }
    }
    setIsTeamModalOpen(false);
  };

  const handleGameModeChange = async () => {
    if (selectedGameMode && selectedGameMode !== gameMode) {
      try {
        await apiService.put(`/lobby/${id}`, selectedGameMode, {
          Authorization: `Bearer ${token}`,
        });
        setGameMode(selectedGameMode);
        setIsGameModeModalOpen(false);
      } catch (err) {
        console.error("Failed to change game mode", err);
      }
    } else {
      setIsGameModeModalOpen(false);
    }
  };

  const handleAddCustomWord = async () => {
    if (!newCustomWord.trim()) return; 
    try {
      await apiService.put(
        `/lobby/${id}/customWord`,
        { word: newCustomWord }, 
        { Authorization: `Bearer ${token}` }
      );
      setNewCustomWord(''); 
    } catch (error) {
      console.error("Error adding custom word:", error);
      alert("Failed to add custom word.");
    }
  };

  const handleLeaveLobby = async () => {
    try {
      await apiService.delete(`/lobby/${id}/${userId}`, {
        Authorization: `Bearer ${token}`
      });
      localStorage.removeItem("isSpymaster");
      localStorage.removeItem("playerTeam");
      localStorage.removeItem("lobbyCode");
      router.replace('/mainpage');
    } catch (error) {
      console.error("Error leaving lobby:", error);
      alert("Could not leave the lobby.");
    }
  };
   const handleCopyLobbyCode = async () => {
     if (lobbyCode !== null) {
       try {
         await navigator.clipboard.writeText(lobbyCode.toString());
         message.success("Lobby code copied!");
       } catch (err) {
         console.error("Failed to copy lobby code:", err);
         message.error("Could not copy the code.");
       }
     }
   };


  const backgroundColor =
    teamColor === 'red' ? '#ff6161' :
      teamColor === 'blue' ? '#61b5ff' :
        '#333';

  function formatEnum(value?: string) {
    if (!value) return "...";
    return value
        .toLowerCase()
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor }}>

      <div className="flex flex-col items-center gap-8">

        <Card
          className="p-8 text-center"
          style={{ width: '100%', maxWidth: 300 }}
          title={<h1 className="text-2xl font-bold text-white">Game Lobby</h1>}
        >
          <p>Your Role: <b>{formatEnum(role ?? "")}</b></p>
          <p>Your Team: <b>{formatEnum(teamColor ?? "")}</b></p>
          <p>Gamemode: <b>{formatEnum(gameMode ?? "")}</b></p>
        <div className="flex items-center gap-2 justify-center mt-2">
           <span>Lobby Code:</span>
           {lobbyCode && (
           <Button
             size="small"
             type="default"
             onClick={handleCopyLobbyCode}
           >
             {lobbyCode} <CopyOutlined />
           </Button>
           )}
         </div>

          <p>Players Ready: <b>{readyPlayers}/{totalPlayers}</b></p>

          <div className="!mt-2 flex flex-col gap-2 items-center">
            <Button size="small" className="w-48 h-8 text-sm" onClick={handleReadyToggle}>
              {ready ? "Ready ✔" : "Click to Ready"}
            </Button>
            <Button size="small" className="w-48 h-8 text-sm" onClick={() => !ready && setIsRoleModalOpen(true)} disabled={ready}>
              Change Role
            </Button>
            <Button size="small" className="w-48 h-8 text-sm" onClick={() => !ready && setIsTeamModalOpen(true)} disabled={ready}>
              Change Team
            </Button>
            <Button
                size="small"
                className="w-48 h-8 text-sm"
                onClick={() => {
                  setSelectedGameMode(gameMode);
                  setIsGameModeModalOpen(true);
                }}
                disabled={ready}
            >
              Change GameMode
            </Button>
            <Button size="small" danger className="w-48 h-8 text-sm" onClick={handleLeaveLobby}>
              Leave Lobby
            </Button>
          </div>
        </Card>

        {/* Custom Words only visible when gamemode == OWN_WORDS*/}
        {gameMode === 'OWN_WORDS' && (
          <Card
            className="p-6 text-center"
            style={{ width: '100%', maxWidth: 400 }}
            title={<h2 className="text-xl font-bold text-white">Custom Words</h2>}
          >
            <div className="mb-4 flex flex-col items-center gap-2 mb-10">
            {customWords.length === 0 ? (
              <p className="text-white">No words added yet.</p>
            ) : (
              <div className="flex flex-wrap justify-center gap-2 text-white">
                {customWords.map((word, index) => (
                  <div
                    key={index}
                    className="px-3 py-1 rounded border border-gray-300 bg-gray-200 text-black text-sm hover:bg-gray-300 transition-colors"
                  >
                    {word}
                  </div>
                ))}
              </div>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <input
                type="text"
                value={newCustomWord}
                onChange={(e) => setNewCustomWord(e.target.value)}
                placeholder="Enter new word"
                className="p-2 rounded text-black"
                style={{ color: 'white', backgroundColor: '#333' }}
              />
              <Button 
                type="primary" 
                onClick={handleAddCustomWord}
                disabled={customWords.length >= 25} //when reaching 25 custom words button is no longer available 
              >
                Add
              </Button>
            </div>
            <p className="text-xs mt-2 text-white">{customWords.length} / 25 words added</p>
          </Card>
        )}
      </div>

        {/* Role Modal */}
        <Modal
          open={isRoleModalOpen}
          onCancel={() => setIsRoleModalOpen(false)}
          footer={null}
          centered
          title={<h2 className="text-black text-center w-full">Choose Role</h2>}
        >
          <div className="flex flex-col items-center gap-4">
            <Button
              type={selectedRole === "SPYMASTER" ? "primary" : "default"}
              onClick={() => setSelectedRole("SPYMASTER")}
              block
            >
              Spymaster
            </Button>
            <Button
              type={selectedRole === "FIELD_OPERATIVE" ? "primary" : "default"}
              onClick={() => setSelectedRole("FIELD_OPERATIVE")}
              block
            >
              Field Operative
            </Button>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleRoleChange}>Confirm</Button>
            </div>
          </div>
        </Modal>

        {/* Team Modal */}
        <Modal
          open={isTeamModalOpen}
          onCancel={() => setIsTeamModalOpen(false)}
          footer={null}
          centered
          title={<h2 className="text-black text-center w-full">Choose Team</h2>}
        >
          <div className="flex flex-col items-center gap-4">
            <Button
              type={selectedTeam === "red" ? "primary" : "default"}
              onClick={() => setSelectedTeam("red")}
              block
            >
              Team Red
            </Button>
            <Button
              type={selectedTeam === "blue" ? "primary" : "default"}
              onClick={() => setSelectedTeam("blue")}
              block
            >
              Team Blue
            </Button>
            <div className="mt-4 flex gap-3">
              <Button onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleTeamChange}>Confirm</Button>
            </div>
          </div>
        </Modal>

        <Modal
            open={isGameModeModalOpen}
            onCancel={() => setIsGameModeModalOpen(false)}
            footer={null}
            centered
            title={<h2 className="text-black text-center w-full">Choose Game Mode</h2>}
        >
          <div className="flex flex-col items-center gap-4">
            <Button
                type={selectedGameMode === "CLASSIC" ? "primary" : "default"}
                onClick={() => setSelectedGameMode("CLASSIC")}
                block
            >
              Classic
            </Button>
            <Button
                type={selectedGameMode === "OWN_WORDS" ? "primary" : "default"}
                onClick={() => setSelectedGameMode("OWN_WORDS")}
                block
            >
              Own Words
            </Button>

            <div className="mt-4 flex gap-3">
              <Button onClick={() => setIsGameModeModalOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={handleGameModeChange}>Confirm</Button>
            </div>
          </div>
        </Modal>
      </div>
  );
}