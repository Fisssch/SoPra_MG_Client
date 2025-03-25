'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#a34d3f] text-white relative flex flex-col items-center px-4 pt-16">
      {/* Profile icon in the top-right corner */}
      <div className="absolute top-4 right-4">
        <Button
          shape="circle"
          icon={<UserOutlined />}
          size="large"
          onClick={() => router.push('/profile')}
          
        />
      </div>

      {/* Title */}
      <h1 className="text-8xl font-extrabold mt-32! mb-32!">Codenames +</h1>

      {/* Buttons */}
      <div className="flex gap-6">
        <Button
          type="default"
          size="large"
          className="bg-white text-black font-medium rounded-md px-6 py-2"
          onClick={() => router.push('/lobby')}
        >
          Join Lobby
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
