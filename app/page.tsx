'use client';
import '@ant-design/v5-patch-for-react-19';
import { useRouter } from 'next/navigation';
import { Button } from 'antd';

export default function Home() {
	const router = useRouter();

	return (
		<div
			className="h-screen flex flex-col items-center justify-center text-white text-center px-4"
			style={{
				background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)'
			}}
		>

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

			<h1
				className="text-xl font-medium text-center tracking-tight"
				style={{
					color: 'white',
					WebkitTextStroke: '1px transparent',
					background: 'linear-gradient(to right, #00b4d8, #ff1e00)',
					WebkitBackgroundClip: 'text',
					backgroundClip: 'text',
					WebkitTextFillColor: 'white',
				}}
			>
				Please register or log in first
			</h1>

		  {/* First row: Register / Sign in */}
			<div className="flex flex-col items-center gap-2! mt-4! w-full max-w-sm">
				<Button
					type="primary"
					size="large"
					style={{width: '60%' }}
					onClick={() => router.push("/login")}
				>
					Sign in
				</Button>
				<Button
					type="default"
					size="large"
					style={{width: '60%' }}
					onClick={() => router.push("/register")}
				>
					Register
				</Button>
			</div>
		</div>
	  );
	}