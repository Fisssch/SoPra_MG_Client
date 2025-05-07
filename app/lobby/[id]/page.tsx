'use client';

import '@ant-design/v5-patch-for-react-19';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { App, Button, Card, Modal, Popover } from 'antd';
import { webSocketService } from '@/api/webSocketService';
import { CopyOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';

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
	createdAt: string;
	language: string;
}
interface LobbyPlayerStatusDTO {
	totalPlayers: number;
	readyPlayers: number;
}
interface LobbyPlayer {
	username: string;
	role: string;
	team: string;
	ready: boolean;
}
interface ExtendedLobbyStatusDTO {
	totalPlayers: number;
	readyPlayers: number;
	players: LobbyPlayer[];
}
interface ChatMessageDTO {
	sender: string;
	message: string;
}

export default function LobbyPage() {
	const router = useRouter();
	const { id } = useParams();
	const apiService = useApi();
	const { message } = App.useApp();

	const [timeLeft, setTimeLeft] = useState<number>(600); // 600 Sekunden = 10 Minuten
	// const [timerActive, setTimerActive] = useState<boolean>(true);

	const [role, setRole] = useState<string | null>(null);
	const [teamColor, setTeamColor] = useState<string | null>(null);
	const [prevTeamColor, setPrevTeamColor] = useState<string | null>(null);
	const [ready, setReady] = useState<boolean>(false);
	const [lobbyCode, setLobbyCode] = useState<number | null>(null);
	const [gameMode, setGameMode] = useState<string | null>(null);
	const [language, setLanguage] = useState<string | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);

	const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<string | null>(null);

	const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
	const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

	const [isGameModeModalOpen, setIsGameModeModalOpen] = useState(false);
	const [selectedGameMode, setSelectedGameMode] = useState<string | null>(null);

	const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

	const [totalPlayers, setTotalPlayers] = useState<number>(0);
	const [readyPlayers, setReadyPlayers] = useState<number>(0);

	const [customWords, setCustomWords] = useState<string[]>([]);
	const [newCustomWord, setNewCustomWord] = useState<string>('');

	const [theme, setTheme] = useState<string>('');
	const [newTheme, setNewTheme] = useState<string>('');

	const [globalChat, setGlobalChat] = useState<string[]>([]);
	const [teamChat, setTeamChat] = useState<string[]>([]);

	// Chat panel state
	const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
	const [chatMessage, setChatMessage] = useState<string>('');
	const [activeChat, setActiveChat] = useState<'global' | 'team'>('global');
	const bottomRef = useRef<HTMLDivElement | null>(null);

	const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
	const redTeamPlayers = lobbyPlayers.filter(p => p.team === 'RED');
	const blueTeamPlayers = lobbyPlayers.filter(p => p.team === 'BLUE');

	const wsS = useRef(new webSocketService()).current;

	useEffect(() => {
		//if (!timerActive) return;

		const interval = setInterval(() => {
			setTimeLeft(prev => {
				if (prev <= 1) {
					clearInterval(interval);
					return 0;
				}
				return prev - 1;
			});
		}, 1000); // jede Sekunde runterzählen

		return () => clearInterval(interval);
	}, []);

	//load token and id safely if not in a use effect we get an error when reloading the page
	useEffect(() => {
		if (typeof window !== 'undefined') {
			setToken(localStorage.getItem('token')?.replace(/^"|"$/g, '') ?? null);
			setUserId(localStorage.getItem('id')?.replace(/^"|"$/g, '') ?? null);
		}
	}, []);

	const fetchPlayerInfo = useCallback(async () => {
		if (!token || !userId || !id) {
			router.replace('/?message=Missing session data');
			return;
		}

		try {
			localStorage.setItem('_preventLeave', 'false');

			const roleRes = await apiService.get<PlayerRoleDTO>(`/lobby/${id}/role/${userId}`, { Authorization: `Bearer ${token}` });
			setRole(roleRes.role);
			localStorage.setItem('isSpymaster', String(roleRes.role === 'SPYMASTER'));

			const teamRes = await apiService.get<PlayerTeamDTO>(`/lobby/${id}/team/${userId}`, { Authorization: `Bearer ${token}` });
			const usersTeam = teamRes.color.toUpperCase();
			setTeamColor(usersTeam);
			localStorage.setItem('playerTeam', usersTeam);

			const readyRes = await apiService.get<ReadyStatusDTO>(`/lobby/${id}/status/${userId}`, { Authorization: `Bearer ${token}` });
			setReady(readyRes.ready);

			const lobbyInfo = await apiService.get<LobbyInfoDTO>(`/lobby/${id}`, { Authorization: `Bearer ${token}` });
			setLobbyCode(lobbyInfo.lobbyCode);
			localStorage.setItem('lobbyCode', lobbyInfo.lobbyCode.toString());
			setGameMode(lobbyInfo.gameMode);
			localStorage.setItem('gameMode', lobbyInfo.gameMode);
			setLanguage(lobbyInfo.language);
			localStorage.setItem('language', lobbyInfo.language);

			const statusRes = await apiService.get<LobbyPlayerStatusDTO>(`/lobby/${id}/players`, { Authorization: `Bearer ${token}` });
			const createdAt = new Date(lobbyInfo.createdAt).getTime();
			const now = Date.now();
			const remaining = Math.max(0, 600 - Math.floor((now - createdAt) / 1000));
			setTimeLeft(remaining);
			setTotalPlayers(statusRes.totalPlayers);
			setReadyPlayers(statusRes.readyPlayers);

			const existingWords = await apiService.get<string[]>(`/lobby/${id}/customWords`, {
				Authorization: `Bearer ${token}`,
			});
			setCustomWords(existingWords);

			const themeRes = await apiService.get<{ theme: string }>(`/lobby/${id}/theme`, {
				Authorization: `Bearer ${token}`,
			});
			setTheme(themeRes.theme);
		} catch (error) {
			console.error('Error loading player info:', error);
			alert('Player info could not be loaded.');
		}
	}, [token, userId, id]);

	useEffect(() => {
		if (typeof window !== 'undefined') {
			const storedToken = localStorage.getItem('token')?.replace(/^"|"$/g, '') ?? null;
			const storedUserId = localStorage.getItem('id')?.replace(/^"|"$/g, '') ?? null;
			setToken(storedToken);
			setUserId(storedUserId);
		}
	}, []);

	useEffect(() => {
		if (token && userId && id) {
			fetchPlayerInfo();
		}
	}, [token, userId, id]);

	useEffect(() => {
		// Subscribe to team chat when we have a team
		const subscribeToTeamChat = async () => {
			if (teamColor) {
				try {
					await wsS.subscribe(`/topic/lobby/${id}/chat/team/${teamColor}`, (messageDto: ChatMessageDTO) => {
						setTeamChat(prevChat => [...prevChat, `${messageDto.sender}: ${messageDto.message}`]);
					});
				} catch (error) {
					console.error('Error subscribing to team chat:', error);
				}
			}
		};

		setTeamChat([]); // Clear the chat when changing teams
		subscribeToTeamChat();

		// store current team as previous for later unsubscribe
		setPrevTeamColor(teamColor);

		// Clean up subscription when team changes
		return () => {
			if (teamColor) {
				wsS.unsubscribe(`/topic/lobby/${id}/chat/team/${teamColor}`).catch(err => console.error('Error unsubscribing from team chat:', err));
			}
		};
	}, [teamColor, id, wsS]);

	useEffect(() => {
		(async () => {
			try {
				await wsS.connect();

				// Ready/Start
				try {
					await wsS.subscribe(`/topic/lobby/${id}/start`, async (shouldStart: boolean) => {
						if (shouldStart) {
							try {
								const mytoken = localStorage.getItem('token')?.replace(/^"|"$/g, '');
								const startingTeam = Math.random() < 0.5 ? 'RED' : 'BLUE';
								localStorage.setItem('startingTeam', startingTeam);
								await apiService.post(
									`/game/${id}/start`,
									{
										startingTeam: startingTeam,
										gameMode: gameMode?.toUpperCase() ?? 'CLASSIC',
									},
									{
										Authorization: `Bearer ${mytoken}`,
									},
								);
								localStorage.setItem('_preventLeave', 'true');
								router.push(`/game/${id}`);
							} catch (error) {
								console.error('Error starting the game:', error);
								alert('Failed to start the game. Please try again.');
							}
						}
					});
				} catch (startErr) {
					console.error('WebSocket error during start:', startErr);
				}

				// GameMode
				try {
					await wsS.subscribe(`/topic/lobby/${id}/gameMode`, (lobbyDto: LobbyInfoDTO) => {
						setGameMode(lobbyDto.gameMode); // global
						setSelectedGameMode(lobbyDto.gameMode); // lokal
						localStorage.setItem('gameMode', lobbyDto.gameMode);
					});
				} catch (modeErr) {
					console.error('WebSocket error in gamemode:', modeErr);
				}

				// Language
				try {
					await wsS.subscribe(`/topic/lobby/${id}/language`, (language: string) => {
						setLanguage(language); // global
						setSelectedLanguage(language); // lokal
						localStorage.setItem('language', language);
					});
				} catch (modeErr) {
					console.error('WebSocket error in language:', modeErr);
				}

				//number of player
				await wsS.subscribe(`/topic/lobby/${id}/playerStatus`, (status: ExtendedLobbyStatusDTO) => {
					const mappedPlayers: LobbyPlayer[] = status.players.map(player => ({
						username: player.username,
						role: player.role,
						team: player.team,
						ready: player.ready,
					}));
					setLobbyPlayers(mappedPlayers);
					setTotalPlayers(status.totalPlayers);
					setReadyPlayers(status.readyPlayers);
				});

				//own words
				try {
					await wsS.subscribe(`/topic/lobby/${id}/customWords`, (updatedCustomWords: string[]) => {
						console.log('Custom words updated:', updatedCustomWords);
						setCustomWords(updatedCustomWords);
					});
				} catch (customWordsErr) {
					console.error('WebSocket error in customWords:', customWordsErr);
				}

				// Auto-close timeout listener
				try {
					await wsS.subscribe(`/topic/lobby/${id}/close`, () => {
						message.info('Lobby was closed due to inactivity');
						router.replace('/mainpage?message=Lobby%20closed%20due%20to%20inactivity');
					});
				} catch (closeErr) {
					console.error('WebSocket error on close:', closeErr);
				}

				//theme
				try {
					await wsS.subscribe(`/topic/lobby/${id}/theme`, (receivedTheme: string) => {
						console.log('Received updated theme:', receivedTheme);
						setTheme(receivedTheme);
					});
				} catch (themeErr) {
					console.error('Websocket error in theme:', themeErr);
				}

				// all players ready but not good to start
				try {
					await wsS.subscribe(`/topic/lobby/${id}/readyError`, (reason: string) => {
						message.error(`Could not start game: ${reason}`);
					});
				} catch (readyErr) {
					console.error('Websocket error in readyError:', readyErr);
				}

				try {
					await wsS.subscribe(`/topic/lobby/${id}/chat/global`, (messageDto: ChatMessageDTO) => {
						setGlobalChat(prevChat => [...prevChat, `${messageDto.sender}: ${messageDto.message}`]);
					});
				} catch (readyErr) {
					console.error('Websocket error in global chat:', readyErr);
				}
			} catch (connectionErr) {
				console.error('WebSocket was not able to connect:', connectionErr);
			}
		})();

		return () => {
			try {
				const notPreventLeave = localStorage.getItem('_preventLeave') === 'false';
				if (notPreventLeave) handleLeave(); // Clean up on unmount
			} catch (err) {
				console.error('Error leaving lobby:', err);
			}

			// Unsubscribe all topics to clean websocket properly
			wsS.unsubscribe(`/topic/lobby/${id}/start`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/gameMode`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/playerStatus`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/customWords`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/close`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/theme`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/language`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/readyError`).catch(() => {});
			wsS.unsubscribe(`/topic/lobby/${id}/chat/global`).catch(() => {});
			if (prevTeamColor) {
				wsS.unsubscribe(`/topic/lobby/${id}/chat/team/${prevTeamColor}`).catch(() => {});
			}

			wsS.disconnect();
		};
	}, [id]);

	const handleReadyToggle = async () => {
		try {
			const newReady = !ready;
			await apiService.put<ReadyStatusDTO>(`/lobby/${id}/status/${userId}`, { ready: newReady }, { Authorization: `Bearer ${token}` });
			setReady(newReady);
		} catch (error) {
			console.error('Ready toggle failed:', error);
			alert('Ready status could not be changed.');
		}
	};

	const handleRoleChange = async () => {
		if (selectedRole && selectedRole !== role) {
			try {
				await apiService.put(
					`/lobby/${id}/role/${userId}`,
					{ role: selectedRole },
					{
						Authorization: `Bearer ${token}`,
					},
				);
				setRole(selectedRole);
				localStorage.setItem('isSpymaster', String(selectedRole === 'SPYMASTER'));
			} catch (err) {
				const error = err as { status?: number; message?: string };
				const status = error?.status;
				const msg = error?.message || '';

				if (status === 409 && msg.includes('spymaster')) {
					message.error('Dieses Team hat bereits einen Spymaster.');
				} else {
					message.error('Ein Fehler ist aufgetreten beim Rollenwechsel.');
				}
			}
		}
		setIsRoleModalOpen(false);
	};

	const handleTeamChange = async () => {
		if (selectedTeam && selectedTeam !== teamColor) {
			try {
				// Erst alten Chat unsubscriben
				if (teamColor) {
					await wsS.unsubscribe(`/topic/lobby/${id}/chat/team/${teamColor}`);
				}

				// Teamwechsel an Backend schicken
				await apiService.put(
					`/lobby/${id}/team/${userId}`,
					{ color: selectedTeam },
					{
						Authorization: `Bearer ${token}`,
					},
				);

				await fetchPlayerInfo();
				localStorage.setItem('playerTeam', selectedTeam);

				// Chat leeren und auf neuen Teamchat subscriben
				setTeamChat([]);

				await wsS.subscribe(`/topic/lobby/${id}/chat/team/${selectedTeam}`, (messageDto: ChatMessageDTO) => {
					setTeamChat(prevChat => [...prevChat, `${messageDto.sender}: ${messageDto.message}`]);
				});
			} catch (error) {
				console.error('Error changing team:', error);
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
				console.error('Failed to change game mode', err);
			}
		} else {
			setIsGameModeModalOpen(false);
		}
	};

	const handleLanguageChange = async () => {
		if (selectedLanguage && selectedLanguage !== language) {
			try {
				await apiService.put(`/lobby/${id}/language`, selectedLanguage, {
					Authorization: `Bearer ${token}`,
				});
				setLanguage(selectedLanguage);
				setIsLanguageModalOpen(false);
			} catch (err) {
				console.error('Failed to change language', err);
			}
		} else {
			setIsLanguageModalOpen(false);
		}
	};

	const MAX_CUSTOM_WORD_LENGTH = 15;
	const handleAddCustomWord = async () => {
		const trimmedWord = newCustomWord.trim();

		if (!trimmedWord) return;

		if (trimmedWord.length > MAX_CUSTOM_WORD_LENGTH) {
			message.warning(`Word is too long (max ${MAX_CUSTOM_WORD_LENGTH} characters).`);
			return;
		}

		try {
			await apiService.put(`/lobby/${id}/customWord`, { word: trimmedWord }, { Authorization: `Bearer ${token}` });
			setNewCustomWord('');
		} catch (error) {
			console.error('Error adding custom word:', error);
			alert('Failed to add custom word.');
		}
	};

	const handleRemoveCustomWord = async (wordToRemove: string) => {
		try {
			await apiService.put(
				`/lobby/${id}/customWord/remove`,
				{ word: wordToRemove },
				{
					Authorization: `Bearer ${token}`,
				},
			);
			setCustomWords(prevWords => prevWords.filter(word => word !== wordToRemove));
		} catch (error) {
			console.error('Error removing custom word:', error);
			alert('Failed to remove custom word.');
		}
	};

	const handleSetTheme = async () => {
		if (!newTheme.trim()) return;
		try {
			await apiService.put(
				`/lobby/${id}/theme`,
				{ theme: newTheme },
				{
					Authorization: `Bearer ${token}`,
				},
			);
			setNewTheme(''); // clear the input after sending
		} catch (error) {
			console.error('Failed to set theme:', error);
			alert('Failed to set theme.');
		}
	};

	const handleLeave = async () => {
		const playerId = localStorage.getItem('id')?.replace(/^"|"$/g, '');
		const playerToken = localStorage.getItem('token')?.replace(/^"|"$/g, '');
		if (playerId && playerToken)
			await apiService.delete(`/lobby/${id}/${playerId}`, {
				Authorization: `Bearer ${playerToken}`,
			});
		localStorage.removeItem('isSpymaster');
		localStorage.removeItem('playerTeam');
		localStorage.removeItem('lobbyCode');
		localStorage.removeItem('_preventLeave');
	};

	const handleSendChatMessage = async () => {
		if (!chatMessage.trim()) return;

		try {
			if (activeChat === 'global') {
				await apiService.post(`/lobby/${id}/chat?chatType=global`, chatMessage, { Authorization: `Bearer ${token}` });
			} else if (activeChat === 'team' && teamColor) {
				await apiService.post(`/lobby/${id}/chat?chatType=team`, chatMessage, { Authorization: `Bearer ${token}` });
			}
			setChatMessage('');
		} catch (error) {
			message.error('Could not send the message.');
			console.error(`Error sending ${activeChat} message:`, error);
		}
	};

	const handleLeaveLobby = async () => {
		try {
			localStorage.setItem('_preventLeave', 'true');
			await handleLeave();
			router.replace('/mainpage');
		} catch (error) {
			console.error('Error leaving lobby:', error);
			alert('Could not leave the lobby.');
		}
	};

	const handleCopyLobbyCode = async () => {
		if (lobbyCode !== null) {
			try {
				await navigator.clipboard.writeText(lobbyCode.toString());
				message.success('Lobby code copied!');
			} catch (err) {
				console.error('Failed to copy lobby code:', err);
				message.error('Could not copy the code.');
			}
		}
	};

	const initialGradient = 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)';
	const redTeamGradient = 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%)';
	const blueTeamGradient = 'linear-gradient(to right, #1a425a 0%, #367d9f 10%, #8cc9d7 50%)';

	const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({
		backgroundImage: initialGradient,
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		transition: 'background 1.5s ease-in-out',
	});

	useEffect(() => {
		if (teamColor === 'RED' || teamColor === 'BLUE') {
			const newGradient = teamColor === 'RED' ? redTeamGradient : blueTeamGradient;
			const startPos = '100% 0';
			const endPos = '0% 0';

			// 1. Sofort: Reset-Startposition (ohne Transition!)
			setBackgroundStyle({
				backgroundImage: `${newGradient}, ${initialGradient}`,
				backgroundPosition: startPos,
				backgroundSize: '200% 100%',
				backgroundRepeat: 'no-repeat',
				transition: 'none', // Kein Übergang hier
			});

			// 2. Leicht verzögert: Übergang starten
			setTimeout(() => {
				setBackgroundStyle({
					backgroundImage: `${newGradient}, ${initialGradient}`,
					backgroundPosition: endPos,
					backgroundSize: '200% 100%',
					backgroundRepeat: 'no-repeat',
					transition: 'background-position 1.5s ease-in-out',
				});
			}, 30); // 30ms sorgt zuverlässig für Trigger
		}
	}, [teamColor]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [globalChat, teamChat]);

	function formatEnum(value?: string) {
		if (!value) return '...';
		return value
			.toLowerCase()
			.split('_')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	const TeamTable = ({ title, players }: { title: string; players: LobbyPlayer[]; color: 'RED' | 'BLUE' }) => {
		return (
			<div className='mb-6'>
				<h3 className='text-lg font-bold text-white mb-2'>{title}</h3>

				{/* Header-Zeile */}
				<div className='grid grid-cols-2 gap-x-1 text-white text-base items-center border-t border-white/30 py-2'>
					<span className='text-left'>Username</span>
					<span className='text-left pl-1'>Role</span>
				</div>

				{/* Spieler-Zeilen */}
				<div className='flex flex-col'>
					{players.length === 0 ? (
						<p className='text-white text-sm italic'>No players in this team.</p>
					) : (
						players.map((player, index) => (
							<div key={index} className={`grid grid-cols-2 text-white text-sm items-center border-t border-white/30`}>
								{/* Spalte 1: Username */}
								<div className='px-2 py-2 text-left'>{player.username}</div>

								{/* Spalte 2: Rolle */}
								<div className='px-2 py-2 text-left'>{formatEnum(player.role)}</div>
							</div>
						))
					)}
				</div>
			</div>
		);
	};

	return (
		<div className='min-h-screen w-full flex text-white' style={backgroundStyle}>
			{/* Sidebar */}
			<div className='w-50 bg-[#111827] p-6 text-white flex flex-col gap-6 shadow-xl border-r border-white/10'>
				<h2 className='text-xl font-bold text-white tracking-wide pt-5! px-2!'>Menu</h2>
				<nav className='flex flex-col gap-4 text-sm px-2!'>
					<span onClick={handleReadyToggle} className='flex items-center gap-2 cursor-pointer hover:text-green-400 transition-colors'>
						{ready ? '✅ Ready' : ' Set Ready'}
					</span>
					<span
						onClick={() => !ready && setIsRoleModalOpen(true)}
						className={`flex items-center gap-2 cursor-pointer transition-colors ${ready ? 'text-gray-500 cursor-not-allowed' : 'hover:text-blue-400'}`}>
						Change Role
					</span>
					<span
						onClick={() => !ready && setIsTeamModalOpen(true)}
						className={`flex items-center gap-2 cursor-pointer transition-colors ${ready ? 'text-gray-500 cursor-not-allowed' : 'hover:text-blue-400'}`}>
						Change Team
					</span>
					<span
						onClick={() => !ready && setIsGameModeModalOpen(true)}
						className={`flex items-center gap-2 cursor-pointer transition-colors ${ready ? 'text-gray-500 cursor-not-allowed' : 'hover:text-blue-400'}`}>
						Change GameMode
					</span>
					<span
						onClick={() => !ready && setIsLanguageModalOpen(true)}
						className={`flex items-center gap-2 cursor-pointer transition-colors ${ready ? 'text-gray-500 cursor-not-allowed' : 'hover:text-blue-400'}`}>
						Change Language
					</span>
					<span
						onClick={handleCopyLobbyCode}
						className={`flex items-center gap-2 cursor-pointer transition-colors ${ready ? 'text-gray-500 cursor-not-allowed' : 'hover:text-blue-400'}`}>
						Copy Lobby Code <CopyOutlined />
					</span>
					<span
						onClick={handleLeaveLobby}
						className={`flex items-center gap-2 cursor-pointer transition-colors ${
							ready ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 cursor-pointer hover:text-red-600 transition-colors'
						}`}>
						Leave Lobby
					</span>
				</nav>
			</div>

			{/* Main Content */}
			<div className='flex-1 flex flex-col items-center justify-start pt-4! px-2!' style={backgroundStyle}>
				<div className='w-full max-w-[1600px]'>
					<Card
						className='p-8 text-white rounded-2xl shadow-2xl border border-white/20'
						style={{
							backgroundColor: 'rgba(100, 100, 100, 0.2)',
							backdropFilter: 'blur(6px)',
						}}>
						{/* Game Lobby Info */}
						<div className='mb-6!'>
							<h2 className='text-2xl font-bold mt-0! mb-2'>Game Lobby</h2>
							<p>
								Your Role: <b>{formatEnum(role ?? '')}</b>
							</p>
							<p>
								Your Team: <b>{formatEnum(teamColor ?? '')}</b>
							</p>
							<p>
								Gamemode: <b>{formatEnum(gameMode ?? '')}</b>
							</p>
							<p>
								Language: <b>{formatEnum(language ?? '')}</b>
							</p>
							<p>
								Lobby Code: <b>{lobbyCode}</b>
							</p>
							<p>
								Players Ready:{' '}
								<b>
									{readyPlayers}/{totalPlayers}
								</b>
							</p>
							{timeLeft && timeLeft > 0 && (
								<p className='text-sm mt-2'>
									Lobby will close in{' '}
									<b>
										{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
									</b>{' '}
									min
								</p>
							)}
						</div>

						{/* Team Info */}
						<div className='text-2xl flex flex-col gap-2 mb-4'>
							<h2 className='text-2xl font-bold mb-1!'>Teams</h2>
							<TeamTable title='Red Team' players={redTeamPlayers} color='RED' />
							<TeamTable title='Blue Team' players={blueTeamPlayers} color='BLUE' />
						</div>

						{/* Custom Words only visible when gamemode == OWN_WORDS*/}
						{gameMode === 'OWN_WORDS' && (
							<div className='mt-8!'>
								<h2 className='text-xl font-bold text-white mb-2'>Custom Words</h2>

								{/* Eingabe */}
								<div className='flex gap-2 items-center mb-2!'>
									<input
										type='text'
										value={newCustomWord}
										onChange={e => setNewCustomWord(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter') handleAddCustomWord();
										}}
										placeholder='Enter new word'
										className='p-2 rounded text-white bg-[#333] w-64'
										disabled={customWords.length >= 25}
									/>
									<p className='text-sm text-white'>{customWords.length} / 25 words added</p>
								</div>

								{/* Anzeige der hinzugefügten Wörter */}
								{customWords.length === 0 ? (
									<p className='text-white'>No words added yet.</p>
								) : (
									<div className='flex flex-wrap justify-start gap-x-2! gap-y-2! mt-4!'>
										{customWords.map((word, index) => (
											<div
												key={index}
												className='flex items-center justify-between px-4! py-1! rounded-lg border border-white/30 bg-white/10 backdrop-blur-sm text-white text-sm shadow-sm transition-all'>
												<span>{formatEnum(word)} </span>
												<span
													onClick={() => handleRemoveCustomWord(word)}
													className='ml-1! cursor-pointer text-white hover:text-red-500 transition-colors font-bold'>
													x
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						)}

						{/* Theme */}
						{gameMode === 'THEME' && (
							<div className='mt-8!'>
								<h2 className='text-xl font-bold mb-2!'>Theme</h2>
								<div className='flex gap-2 items-center mb-2!'>
									<input
										type='text'
										value={newTheme}
										onChange={e => setNewTheme(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter' && newTheme.trim()) {
												handleSetTheme();
											}
										}}
										placeholder='Enter theme'
										className='p-2 rounded text-white bg-[#333] w-64'
									/>
								</div>
								{theme && (
									<p className='text-sm'>
										Current Theme: <strong>{theme}</strong>
									</p>
								)}
							</div>
						)}
					</Card>
				</div>
			</div>

			{/* Chat */}
			{isChatOpen && (
				<div
					className='absolute right-1 bottom-1 w-80 h-96 bg-[#1f2937]/95 backdrop-blur-md shadow-2xl border border-white/10 rounded-xl flex flex-col overflow-hidden'
					style={{ zIndex: 100 }}>
					{/* Chat Header */}
					<div className='flex justify-between items-center px-1! py-1! bg-[#111827] border-b border-white/10!'>
						<div className='flex space-x-2!'>
							<button
								onClick={() => setActiveChat('global')}
								style={{ all: 'unset', cursor: 'pointer', padding: '4px 6px' }}
								className={`text-sm rounded transition-colors
									${activeChat === 'global' ? 'text-white! font-bold!' : 'text-white/60! hover:text-white! hover:text-white'}
								`}>
								Global
							</button>

							<button
								onClick={() => setActiveChat('team')}
								style={{ all: 'unset', cursor: 'pointer', padding: '4px 6px' }}
								className={`text-sm rounded transition-colors
									${activeChat === 'team' ? 'text-white! font-bold!' : 'text-white/60! hover:text-white! hover:text-white'}
								`}>
								Team
							</button>
						</div>
						<button
							onClick={() => setIsChatOpen(false)}
							className='text-white/60 text-sm px-2! py-1! rounded! bg-white/5 hover:bg-white/10! hover:text-red-500! transition-colors'
							style={{ all: 'unset', cursor: 'pointer' }}>
							×
						</button>
					</div>

					{/* Chat Messages */}
					<div className='flex-1 overflow-y-auto px-2! py-1! space-y-2! text-sm break-words'>
						{activeChat === 'global' ? (
							globalChat.length > 0 ? (
								globalChat.map((msg, index) => (
									<div key={index} className=' text-white p-2'>
										{msg.replace(/"([^"]*)"/g, '$1')}
									</div>
								))
							) : (
								<div className='text-white/40 text-center'>No global messages yet</div>
							)
						) : teamChat.length > 0 ? (
							teamChat.map((msg, index) => (
								<div key={index} className='text-white p-2'>
									{msg.replace(/"([^"]*)"/g, '$1')}
								</div>
							))
						) : (
							<div className='text-white/40 text-center'>No team messages yet</div>
						)}
						{/* Scroll target */}
						<div ref={bottomRef} />
					</div>

					{/* Message Input */}
					<div className='border-t border-white/10 p-1! bg-[#111827] flex items-center gap-2'>
						<input
							type='text'
							value={chatMessage}
							onChange={e => setChatMessage(e.target.value)}
							onKeyDown={e => {
								if (e.key === 'Enter') handleSendChatMessage();
							}}
							placeholder={`Type ${activeChat} message...`}
							className='flex-1 bg-gray-800 text-white placeholder-white/50 p-2 rounded-md text-sm outline-none'
						/>
					</div>
				</div>
			)}

			{/* Modals */}
			<Modal
				open={isRoleModalOpen}
				onCancel={() => setIsRoleModalOpen(false)}
				footer={null}
				centered
				closeIcon={
					<CloseOutlined
						className={`transition-colors duration-200 text-gray-400 hover:${
							teamColor === 'RED' ? 'text-red-500!' : teamColor === 'BLUE' ? 'text-blue-500!' : 'text-gray-500!'
						}`}
						style={{ fontSize: '18px' }}
					/>
				}
				title={<div className='text-center text-black text-lg font-semibold'>Choose Role</div>}>
				<div className='flex flex-col items-center gap-4'>
					<Button
						type={selectedRole === 'SPYMASTER' ? 'primary' : 'default'}
						onClick={() => setSelectedRole('SPYMASTER')}
						block
						className='flex items-center justify-start gap-2'>
						<span>Spymaster</span>
						<div className='ml-auto' onClick={e => e.stopPropagation()}>
							<Popover
								title='Spymaster'
								trigger='click'
								styles={{
									body: {
										backgroundColor: '#1f2937',
										color: 'white',
										maxWidth: '260px',
										whiteSpace: 'normal',
										fontSize: '13px',
										lineHeight: '1.4',
									},
								}}
								content={
									<span>
										As the Spymaster, your job is to guide your teammates toward the correct words on the board by giving clever clues. You can only
										give one word as a clue and a number that tells your team how many of the words on the board relate to that clue. Your teammates
										will then discuss and try to guess which words you meant. Be careful though, you must avoid giving clues that could lead them to
										words belonging to the other team or, even worse, the assassin word (black card)S!
									</span>
								}>
								<InfoCircleOutlined
									className={`text-gray-700! cursor-pointer text-lg ${
										teamColor === 'RED' ? 'hover:text-red-500!' : teamColor === 'BLUE' ? 'hover:text-blue-500!' : 'hover:text-gray-500!'
									}`}
								/>
							</Popover>
						</div>
					</Button>
					<Button
						type={selectedRole === 'FIELD_OPERATIVE' ? 'primary' : 'default'}
						onClick={() => setSelectedRole('FIELD_OPERATIVE')}
						block
						className='flex items-center justify-start gap-2'>
						<span>Field Operative</span>
						<div className='ml-auto' onClick={e => e.stopPropagation()}>
							<Popover
								title='Field Operative'
								trigger='click'
								styles={{
									body: {
										backgroundColor: '#1f2937',
										color: 'white',
										maxWidth: '260px',
										whiteSpace: 'normal',
										fontSize: '13px',
										lineHeight: '1.4',
									},
								}}
								content={
									<span>
										In Codenames, Field Operatives are the players who use the Spymaster’s clues to identify their team’s words from the cards on the
										board. Their goal is to guess as many correct words as possible without accidentally selecting the assassin word (black card) or
										the opposing teams words.
									</span>
								}>
								<InfoCircleOutlined
									className={`text-gray-700! cursor-pointer text-lg ${
										teamColor === 'RED' ? 'hover:text-red-500!' : teamColor === 'BLUE' ? 'hover:text-blue-500!' : 'hover:text-gray-500!'
									}`}
								/>
							</Popover>
						</div>
					</Button>
					<div className='mt-4 flex gap-3'>
						<Button onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
						<Button type='primary' onClick={handleRoleChange}>
							Confirm
						</Button>
					</div>
				</div>
			</Modal>

			<Modal
				open={isTeamModalOpen}
				onCancel={() => setIsTeamModalOpen(false)}
				footer={null}
				centered
				closeIcon={
					<CloseOutlined
						className={`transition-colors duration-200 text-gray-400 hover:${
							teamColor === 'RED' ? 'text-red-500!' : teamColor === 'BLUE' ? 'text-blue-500!' : 'text-gray-500!'
						}`}
						style={{ fontSize: '18px' }}
					/>
				}
				title={<div className='text-center text-black text-lg font-semibold'>Choose Team</div>}>
				<div className='flex flex-col items-center gap-4'>
					<Button
						type={selectedTeam === 'red' ? 'primary' : 'default'}
						style={{
							background: selectedTeam === 'red' ? 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 80%)' : undefined,
							borderColor: '#8b0000',
							color: selectedTeam === 'red' ? 'white' : '#8b0000',
						}}
						onClick={() => setSelectedTeam('red')}
						block>
						Team Red
					</Button>

					<Button
						type={selectedTeam === 'blue' ? 'primary' : 'default'}
						style={{
							background: selectedTeam === 'blue' ? 'linear-gradient(to right, #1a425a 0%, #367d9f 10%, #8cc9d7 80%)' : undefined,
							borderColor: '#1a425a',
							color: selectedTeam === 'blue' ? 'white' : '#1a425a',
						}}
						onClick={() => setSelectedTeam('blue')}
						block>
						Team Blue
					</Button>

					<div className='mt-4 flex gap-3'>
						<Button onClick={() => setIsTeamModalOpen(false)}>Cancel</Button>
						<Button type='primary' onClick={handleTeamChange}>
							Confirm
						</Button>
					</div>
				</div>
			</Modal>

			<Modal
				open={isGameModeModalOpen}
				onCancel={() => setIsGameModeModalOpen(false)}
				footer={null}
				centered
				closeIcon={
					<CloseOutlined
						className={`transition-colors duration-200 text-gray-400 hover:${
							teamColor === 'RED' ? 'text-red-500!' : teamColor === 'BLUE' ? 'text-blue-500!' : 'text-gray-500!'
						}`}
						style={{ fontSize: '18px' }}
					/>
				}
				title={<div className='text-center text-black text-lg font-semibold'>Choose Game Mode</div>}>
				<div className='flex flex-col items-center gap-4'>
					<Button
						type={selectedGameMode === 'CLASSIC' ? 'primary' : 'default'}
						onClick={() => setSelectedGameMode('CLASSIC')}
						block
						className='flex items-center justify-start gap-2!'>
						<span>Classic</span>
						<div className='ml-auto' onClick={e => e.stopPropagation()}>
							<Popover
								title='Classic Mode'
								content='The classic game mode with randomly generated words.'
								trigger='click'
								styles={{
									body: {
										backgroundColor: '#1f2937',
										color: 'white',
									},
								}}>
								<InfoCircleOutlined
									className={`text-gray-700! cursor-pointer text-lg ${
										teamColor === 'RED' ? 'hover:text-red-500!' : teamColor === 'BLUE' ? 'hover:text-blue-500!' : 'hover:text-gray-500!'
									}`}
								/>
							</Popover>
						</div>
					</Button>
					<Button
						type={selectedGameMode === 'OWN_WORDS' ? 'primary' : 'default'}
						onClick={() => setSelectedGameMode('OWN_WORDS')}
						block
						className='flex items-center justify-start gap-2'>
						<span>Own Words</span>
						<div className='ml-auto' onClick={e => e.stopPropagation()}>
							<Popover
								title='Own Words Mode'
								content='Bring your own words up to 25! The game fills in the rest if needed.'
								trigger='click'
								styles={{
									body: {
										backgroundColor: '#1f2937',
										color: 'white',
									},
								}}>
								<InfoCircleOutlined
									className={`text-gray-700! cursor-pointer text-lg ${
										teamColor === 'RED' ? 'hover:text-red-500!' : teamColor === 'BLUE' ? 'hover:text-blue-500!' : 'hover:text-gray-500!'
									}`}
								/>
							</Popover>
						</div>
					</Button>
					<Button
						type={selectedGameMode === 'THEME' ? 'primary' : 'default'}
						onClick={() => setSelectedGameMode('THEME')}
						block
						className='flex items-center justify-start gap-2'>
						<span>Theme</span>
						<div className='ml-auto' onClick={e => e.stopPropagation()}>
							<Popover
								title='Theme Mode'
								content='Choose a theme, and the game will generate words that match it.'
								trigger='click'
								styles={{
									body: {
										backgroundColor: '#1f2937',
										color: 'white',
									},
								}}>
								<InfoCircleOutlined
									className={`text-gray-700! cursor-pointer text-lg ${
										teamColor === 'RED' ? 'hover:text-red-500!' : teamColor === 'BLUE' ? 'hover:text-blue-500!' : 'hover:text-gray-500!'
									}`}
								/>
							</Popover>
						</div>
					</Button>
					<div className='mt-4 flex gap-3'>
						<Button onClick={() => setIsGameModeModalOpen(false)}>Cancel</Button>
						<Button type='primary' onClick={handleGameModeChange}>
							Confirm
						</Button>
					</div>
				</div>
			</Modal>

			<Modal
				open={isLanguageModalOpen}
				onCancel={() => setIsLanguageModalOpen(false)}
				footer={null}
				centered
				closeIcon={
					<CloseOutlined
						className={`transition-colors duration-200 text-gray-400 hover:${
							teamColor === 'RED' ? 'text-red-500!' : teamColor === 'BLUE' ? 'text-blue-500!' : 'text-gray-500!'
						}`}
						style={{ fontSize: '18px' }}
					/>
				}
				title={<div className='text-center text-black text-lg font-semibold'>Choose Language</div>}>
				<div className='flex flex-col items-center gap-4'>
					<Button
						type={selectedLanguage === 'GERMAN' ? 'primary' : 'default'}
						onClick={() => setSelectedLanguage('GERMAN')}
						block
						className='flex items-center justify-start gap-2!'>
						<span>German</span>
					</Button>
					<Button
						type={selectedLanguage === 'ENGLISH' ? 'primary' : 'default'}
						onClick={() => setSelectedLanguage('ENGLISH')}
						block
						className='flex items-center justify-start gap-2!'>
						<span>English</span>
					</Button>
					<Button
						type={selectedLanguage === 'FRENCH' ? 'primary' : 'default'}
						onClick={() => setSelectedLanguage('FRENCH')}
						block
						className='flex items-center justify-start gap-2!'>
						<span>French</span>
					</Button>
					<Button
						type={selectedLanguage === 'ITALIAN' ? 'primary' : 'default'}
						onClick={() => setSelectedLanguage('ITALIAN')}
						block
						className='flex items-center justify-start gap-2!'>
						<span>Italian</span>
					</Button>
					<div className='mt-4 flex gap-3'>
						<Button onClick={() => setIsLanguageModalOpen(false)}>Cancel</Button>
						<Button type='primary' onClick={handleLanguageChange}>
							Confirm
						</Button>
					</div>
				</div>
			</Modal>

			{/* Chat Icon */}
			{!isChatOpen && (
				<button
					onClick={() => setIsChatOpen(true)}
					className='fixed bottom-3 right-3 z-50 rounded-full! hover:bg-white/70!'
					style={{ backdropFilter: 'blur(4px)' }}>
					<span className='text-xl'>💬</span>
				</button>
			)}
		</div>
	);
}
