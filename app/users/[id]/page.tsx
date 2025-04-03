"use client";

import "@ant-design/v5-patch-for-react-19";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import React, { useEffect, useState } from "react";
import { Button, Card, Alert } from "antd";

const UserProfile: React.FC = () => {
    const { id } = useParams();
    const router = useRouter();
    const apiService = useApi();
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.replace("/?message=Please login first.");
        } else {
            setAuthorized(true);
        }
    }, []);

    useEffect(() => {
        if (authorized && id) {
            fetchUserInfo(id as string);
        }
    }, [authorized, id]);

    const fetchUserInfo = async (userId: string) => {
        try {
            const rawToken = localStorage.getItem("token");
            const token = rawToken?.replace(/^"|"$/g, "");

            const user = await apiService.get<User>(`/users/${userId}`, {
                Authorization: `Bearer ${token}`,
            });

            setUser(user);
        } catch (error) {
            if (error instanceof Error) {
                setError("Failed to load user data.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (authorized === null) {
        return null;
    }

    return (
        <div className="page-background" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", padding: "1rem" }}>
            <div className="card-container" style={{ width: "100%", maxWidth: "500px" }}>
                {error && (
                    <Alert
                        message="Error"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: "1rem" }}
                    />
                )}

                {!loading && user && (
                    <Card title="Stats Page" variant="outlined" style={{ textAlign: "center" }}>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Status:</strong> {user.onlineStatus}</p>
                        <p>
                            <strong style={{ color: "green" }}>Wins:</strong>{" "}
                            <span style={{ color: "green" }}>{user.wins}</span>
                        </p>
                        <p>
                            <strong style={{ color: "red" }}>Losses:</strong>{" "}
                            <span style={{ color: "red" }}>{user.losses}</span>
                        </p>
                        <p><strong>Black Card Guesses:</strong> {user.blackCardGuesses}</p>

                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            marginTop: "20px"
                        }}>
                            <Button type="primary" onClick={() => router.push("/users")}>
                                Back to Users
                            </Button>
                        </div>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            marginTop: "20px"
                        }}>
                        <Button onClick={() => router.push('/mainpage')} type="default">
                            Back to Home
                        </Button>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
