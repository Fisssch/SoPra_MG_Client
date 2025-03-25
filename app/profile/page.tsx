'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'antd';

export default function LobbyPage() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear(); // or just remove token/id if needed
    router.push('/');
  };

  const handleChangePassword = () => {
    router.push('/change-password'); // update this route if needed
  };

  const handleChangeUsername = () => {
    router.push('/change-username'); // update this route if needed
  };

  return (
    <div className="min-h-screen bg-[#a34d3f] text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-7xl font-bold mb-16!">User profile options</h1>
      <div className="flex flex-col gap-6 w-full max-w-xs">
        <Button type="primary" size="large" onClick={handleLogout}>
          Logout
        </Button>
        <Button type="default" size="large" onClick={handleChangePassword}>
          Change Password
        </Button>
        <Button type="default" size="large" onClick={handleChangeUsername}>
          Change Username
        </Button>
      </div>
    </div>
  );
}
