'use client';

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from 'next/navigation';
import { Button } from 'antd';
import {useEffect, useState} from "react";
import { useApi } from "@/hooks/useApi";


interface User {
  id: number;
  username: string;
}

export default function Profile() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const apiService = useApi();


  useEffect(() => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    const userId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

    if (!token || !userId) {
      router.replace("/?message=Please login first.");
      return;
    }

    setAuthorized(true);

    // Gets the user for showcase the username
    const fetchUser = async () => {
      try {
        const response = await apiService.get<User>(`/users/${userId}`, {
          Authorization: `Bearer ${token}`,
        });
        setUser(response);
      } catch (error) {
        console.error("Error during loading of the user:", error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    let token = localStorage.getItem("token");

    if (!token) {
      console.error("Missing token");
      return;
    }

    token = token.replace(/^"|"$/g, "");

    try {
      await apiService.post("/users/logout", null, {
        Authorization: `Bearer ${token}`,
      });

      localStorage.clear();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleChangeUsername = () => {
    router.push('/change-username'); // update this route if needed
  };

  const handleChangePassword = () => {
    router.push('/change-password'); // update this route if needed
  };

  if (authorized === null) {
    return null;
  }

  return (
      <div
          className="h-screen flex flex-col items-center justify-center text-white text-center px-4"
          style={{
            background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)'
          }}
      >
        <h1
            className="text-7xl font-bold mt-[50px] text-center mb-5!"
            style={{
              color: 'white',
              WebkitTextStroke: '2px transparent',
              background: 'linear-gradient(to right, #00b4d8, #ff1e00)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'white',
            }}
        >
        User profile options
        </h1>

      {user && (
          <h1
              className="text-4xl font-medium text-center tracking-tight mb-10!"
              style={{
                color: 'white',
                WebkitTextStroke: '1px transparent',
                background: 'linear-gradient(to right, #00b4d8, #ff1e00)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'white',
              }}
          >
            Logged in as: {user.username}
          </h1>
      )}
      <div className="flex flex-col items-center gap-3! w-full max-w-xs">
        <Button type="primary" size= "middle" style={{ width: 250 }} onClick={handleLogout}>
          Logout
        </Button>
        <Button type="default" size="middle" style={{ width: 250 }} onClick={handleChangeUsername}>
          Change Username
        </Button>
        <Button type="default" size="middle" style={{ width: 250 }} onClick={handleChangePassword}>
          Change Password
        </Button>
      </div>
    </div>
  );
}
