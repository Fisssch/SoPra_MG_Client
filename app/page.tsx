'use client'; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering
import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from 'antd';
import { BookOutlined, CodeOutlined, GlobalOutlined } from '@ant-design/icons';
import styles from '@/styles/page.module.css';
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
		<div className="min-h-screen bg-[#a34d3f] flex flex-col items-center justify-center text-white text-center px-4  ">
		  <h1 className="text-8xl font-bold mb-50!">Codenames +</h1>
		  <p className="text-2xl mb-5!">Please register or log in first</p>
		  <div className="flex gap-4">
			<Button type="primary" size="large" onClick={() => router.push("/register")}>
			  Register
			</Button>
			<Button type="default" size="large" onClick={() => router.push("/login")}>
			  Sign in
			</Button>
		  </div>
		</div>
	  );
	}