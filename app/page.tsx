'use client';
import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { webSocketService } from './api/webSocketService';
import { useApi } from './hooks/useApi';
import { useEffect } from 'react';

export default function Home() {
	const wsS = new webSocketService();
	let isNormal = true;

	useEffect(() => {
		return () => {
			wsS.disconnect();
		};
	}, []);

	const router = useRouter();
	const apiService = useApi();

	const connectWS = async () => {
		try {
			await wsS.connect();
		} catch (e) {
			console.log(e);
			return;
		}
		await wsS.subscribe('/topic/lobby', lobby => {
			alert('New game mode: ' + lobby.gameMode);
		});
	};

	const changeGameMode = async () => {
		isNormal = !isNormal;
		await apiService.put('/lobby/12', isNormal ? 'TIMED' : 'NORMAL');
	};

	return (
		<div className="min-h-screen bg-[#a34d3f] flex flex-col items-center text-white text-center px-4 py-12">
		  <h1 className="text-8xl font-bold mt-50!">Codenames +</h1>
		  <p className="text-2xl mt-10!">Please register or log in first</p>
	  
		  {/* First row: Register / Sign in */}
		  <div className="flex gap-4 mt-8!">
			<Button type="primary" size="large" onClick={() => router.push("/register")}>
			  Register
			</Button>
			<Button type="default" size="large" onClick={() => router.push("/login")}>
			  Sign in
			</Button>
		  </div>
	  
		  {/* Spacer row */}
		  <div className="h-10" />
	  
		  {/* Second row: Other buttons */}
		  <div className="flex flex-wrap justify-center gap-4">
			<Button
			  type="primary"
			  color="red"
			  variant="solid"
			  onClick={() => globalThis.open('https://vercel.com/new', '_blank', 'noopener,noreferrer')}
			  target="_blank"
			  rel="noopener noreferrer"
			>
			  Deploy now
			</Button>
			<Button onClick={connectWS} type="primary" variant="solid">
			  Connect
			</Button>
			<Button onClick={changeGameMode} type="primary" variant="solid">
			  Change game mode
			</Button>
		  </div>
		</div>
	  );
	}