'use client';

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { Button, Card, Modal, Radio } from 'antd';
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

export default function LobbyPage() {
    const router = useRouter();
    const { id } = useParams();
    const apiService = useApi();
    const [role, setRole] = useState<string | null>(null);
    const [teamColor, setTeamColor] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>();

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

            } catch (error) {
                console.error("Error during loading with information of the player:", error);
                alert("Player information could not be loaded.");
            }
        };

        fetchPlayerInfo();
    }, [id, token, userId]);

    //websocket
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

        return () => {
            wsS.disconnect();
        };
    }, [id]);

    //ready button function
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
            console.error("Error during updating of the status:", error);
            alert("Ready-Status could not be changed.");
        }
    };

    //Role Change
    const handleRoleChange = async () => {
        if (selectedRole && selectedRole !== role) {
            try {
                await apiService.put(`/lobby/${id}/role/${userId}`,
                    { role: selectedRole },
                    { Authorization: `Bearer ${token}` }
                );
                setRole(selectedRole);
                localStorage.setItem("isSpymaster", String(selectedRole === "SPYMASTER"));
            } catch (error) {
                console.error("Error during role change:", error);
            }
        }
        setIsRoleModalOpen(false);
    };

    const handleTeamChange = async () => {
        if (selectedTeam && selectedTeam !== teamColor) {
            try {
                await apiService.put(`/lobby/${id}/team/${userId}`,
                    { color: selectedTeam },
                    { Authorization: `Bearer ${token}` }
                );
                setTeamColor(selectedTeam);
                localStorage.setItem("playerTeam", selectedTeam);
            } catch (error) {
                console.error("Error during team change:", error);
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
        router.replace('/mainpage');
      } catch (error) {
        console.error("Error leaving the lobby:", error);
        alert("Failed to leave the lobby.");
      }
    };

    const backgroundColor =
        teamColor === 'red' ? '#ff6161' :
            teamColor === 'blue' ? '#61b5ff' :
                '#333';

    return (
        <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor }}>
            <Card
                className="p-8 rounded-2xl shadow-xl text-center bg-white/10 backdrop-blur-md"
                style={{ width: '90%', maxWidth: '600px' }}
                title={<h1 className="text-3xl font-bold text-white">Game Lobby</h1>}
                styles={{ header: { borderBottom: '1px solid #ffffff30' } }}
            >
                <div className="text-xl mb-4 flex items-center justify-center gap-2">
                    <span>Your Role:</span>
                    <span className="font-semibold">{role ? role : 'Lade...'}</span>
                </div>
                {teamColor && (
                    <p className="text-lg mb-3!">
                        Your Team: <span className="font-semibold capitalize">{teamColor}</span>
                    </p>
                )}
                <div className="mt-3 mb-2 flex gap-2 justify-center">
                    <Button
                        type="default"
                        onClick={handleReadyToggle}
                    >
                        {ready ? 'Ready ✔': 'Click to Ready'}
                    </Button>
                    <Button
                        className={`transition-all ${ready ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        onClick={() => {
                            if (!ready) setIsRoleModalOpen(true);
                        }}
                    >
                        Change Role
                    </Button>
                    <Button
                        className={`transition-all ${ready ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        onClick={() => {
                            if (!ready) setIsTeamModalOpen(true);
                        }}
                    >
                        Change Team
                    </Button>
                      <Button danger type="default" onClick={handleLeaveLobby}>
                        Leave Lobby
                      </Button>
                </div>
            </Card>

            <Modal
                title={<h2 className="text-center text-black text-xl font-semibold">Choose Role</h2>}
                open={isRoleModalOpen}
                footer={null}
                onCancel={() => setIsRoleModalOpen(false)}
                centered
                width={400}
            >
                <div className="flex flex-col items-center gap-6 mt-4">
                    <Radio.Group
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="flex gap-4"
                    >
                        <Radio.Button
                            value="SPYMASTER"
                            className={`w-35 text-center px-4 py-2 rounded-md font-semibold flex items-center justify-center border-2 transition-all
                                ${selectedRole === "SPYMASTER"
                                    ? "!border-green-500 !text-green-500 !bg-black"
                                    : "border-black text-white bg-black"}
                            `}
                        >
                            Spymaster
                        </Radio.Button>
                        <Radio.Button
                            value="FIELD_OPERATIVE"
                            className={`w-40 text-center px-4 py-2 rounded-md font-semibold flex items-center justify-center border-2 transition-all
                                ${selectedRole === "FIELD_OPERATIVE"
                                    ? "!border-green-500 !text-green-500 !bg-black"
                                    : "border-black text-white bg-black"}
                            `}
                        >
                            Field Operative
                        </Radio.Button>
                    </Radio.Group>

                    <div className="flex gap-4 justify-center mt-6">
                        <Button
                            onClick={() => setIsRoleModalOpen(false)}
                            className="text-black border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type = "primary"
                            onClick={handleRoleChange}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                title={<h2 className="text-center text-black text-xl font-semibold">Choose Team</h2>}
                open={isTeamModalOpen}
                onCancel={() => setIsTeamModalOpen(false)}
                footer={null}
                centered
                width={400}
            >
                <div className="flex flex-col items-center gap-6 mt-4">
                    <Radio.Group
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="flex gap-4"
                    >
                        <Radio.Button
                            value="red"
                            className={`w-35 text-center px-4 py-2 rounded-md font-semibold flex items-center justify-center border-2 transition-all
                                    ${selectedTeam === "red"
                                ? "!border-red-400 !text-red-400 !bg-black"
                                : "border-black text-white bg-black"}
                                `}
                        >
                            Team Red
                        </Radio.Button>
                        <Radio.Button
                            value="blue"
                            className={`w-40 text-center px-4 py-2 rounded-md font-semibold flex items-center justify-center border-2 transition-all
                                    ${selectedTeam === "blue"
                                ? "!border-blue-400 !text-blue-400 !bg-black"
                                : "border-black text-white bg-black"}
                                `}
                            >
                            Team Blue
                        </Radio.Button>
                    </Radio.Group>

                    <div className="flex gap-4 justify-center mt-6">
                        <Button
                            onClick={() => setIsTeamModalOpen(false)}
                            className="text-black border-gray-300"
                        >
                            Cancel
                        </Button>
                        <Button
                            type = "primary"
                            onClick={handleTeamChange}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
