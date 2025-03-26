'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'antd';

export default function LobbyPage() {
  const router = useRouter();

  const handleLogout = async () => {
    let token = localStorage.getItem('token');


    if (!token) {
      console.error('Missing token or username');
      return;
    }

    token = token.replace(/^"|"$/g, ''); // Removes leading and trailing quotes
    console.log("Token being sent to logout:", token); // Debugging output

    try {
      const response = await fetch('/users/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        localStorage.clear();
        router.push('/');
      } else {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
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
