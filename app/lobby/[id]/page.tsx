'use client';

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Button, Card, Modal } from 'antd';
import { webSocketService } from '@/api/webSocketService';

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

export default function LobbyPage() {
  const router = useRouter();
  const { id } = useParams();
  const apiService = useApi();

  const [role, setRole] = useState<string | null>(null);
  const [teamColor, setTeamColor] = useState<string | null>(null);
  const [ready, setReady] = useState<boolean>(false);
  const [lobbyCode, setLobbyCode] = useState<number | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
  const userId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

  const wsS = new webSocketService();

  useEffect(() => {
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
        await wsS.subscribe(`/topic/lobby/${id}/start`, (shouldStart: boolean) => {
          if (shouldStart) router.push(`/game/${id}`);
        });
      } catch (e) {
        console.error("WebSocket error:", e);
      }
    })();
    return () => wsS.disconnect();
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

  const backgroundColor =
    teamColor === 'red' ? '#ff6161' :
      teamColor === 'blue' ? '#61b5ff' :
        '#333';

  return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor }}>
      <Card
        className="p-8 text-center"
        style={{ width: '100%', maxWidth: 500 }}
        title={<h1 className="text-2xl font-bold text-white">Game Lobby</h1>}
      >
        <p className="text-lg">Your Role: <b>{role ?? "..."}</b></p>
        <p className="text-lg">Your Team: <b>{teamColor ?? "..."}</b></p>
        <p className="text-lg">Lobby Code: <b>{lobbyCode ?? "..."}</b></p>

        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button onClick={handleReadyToggle}>
            {ready ? "Ready ✔" : "Click to Ready"}
          </Button>
          <Button onClick={() => !ready && setIsRoleModalOpen(true)} disabled={ready}>
            Change Role
          </Button>
          <Button onClick={() => !ready && setIsTeamModalOpen(true)} disabled={ready}>
            Change Team
          </Button>
          <Button danger onClick={handleLeaveLobby}>
            Leave Lobby
          </Button>
        </div>
      </Card>

      {/* Role Modal */}
      <Modal
        open={isRoleModalOpen}
        onCancel={() => setIsRoleModalOpen(false)}
        footer={null}
        centered
        title="Choose Role"
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
        title="Choose Team"
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
    </div>
  );
}