"use client"

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { Button } from "antd";
import {useEffect, useState} from "react";


export default function Result() {
    const router = useRouter();
    const [authorized, setAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        if (!token) {
            router.replace("/message=Please login first.");
        } else {
            setAuthorized(true);
        }
    }, []);

    if (authorized === null) {
        return null;
    }

    const handleLogout = async () => {
        const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");

        if (!token) {
            console.error("Missing token or username");
            return;
        }

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
    }

    return (
        <div className="min-h-screen bg-[#a34d3f] text-white relative flex flex-col items-center px-4 pt-16">

            <h1 className="text-8xl font-extrabold mt-32! mb-32!">Team ... has won!</h1>

            <div className="flex gap-6">
                <Button
                    type="default"
                    size="large"
                    className="bg-white text-black font-medium rounded-md px-6 py-2"
                    onClick={() => router.push('/mainpage')}
                >
                    Back to Home
                </Button>

                <Button
                    type="primary"
                    size="large"
                    onClick={handleLogout}
                    >
                    Logout
                </Button>
            </div>
        </div>
    );
}
