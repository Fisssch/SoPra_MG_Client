"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, App } from "antd";
import { useApi } from "@/hooks/useApi";

const EditUsername: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();

    const [newUsername, setNewUsername] = useState("");
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const { message } = App.useApp();

    useEffect(() => {
        const storedToken = localStorage.getItem("token")?.replace(/^"|"$/g, "");
        const storedId = localStorage.getItem("id")?.replace(/^"|"$/g, "");

        if (!storedToken || !storedId) {
            router.replace("/?message=Please login first.");
        } else {
            setToken(storedToken);
            setUserId(storedId);
            setAuthorized(true);
        }
    }, [router]);

    const handleUpdate = async () => {
        if (!userId || !token) return;

        try {
            await apiService.put<void>(
                `/users/${userId}/username`,
                { username: newUsername },
                { Authorization: `Bearer ${token}` }
            );

            message.success("Username updated successfully!");
            router.push(`/mainpage`);
        } catch (error: any) {
            message.error(error.message || "Failed to update username.");
        }
    };

    if (authorized === null) {
        return null;
    }

    return (
            <div
                className="min-h-screen flex items-center justify-center text-white text-center px-4 py-12"
                style={{
                    background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)'
                }}
            >
                <div className="login-container"
                     style = {{maxWidth: "325px", boxShadow: "0 8px 24px rgba(0, 0, 0, 1)",}}
                >
                    <h2 className="text-3xl font-semibold text-center mb-4 text-black">Change Username</h2>

                    <Form
                        name="edit-username"
                        size="large"
                        onFinish={handleUpdate}
                        layout="vertical"
                    >
                        <Form.Item
                            label={
                                <div className="text-black text-center mb-1">New Username</div>
                            }
                            required
                            style={{ display: "flex", justifyContent: "center" }}
                        >
                            <Input
                                placeholder="Enter new username"
                                className="bg-white text-black"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{ width: "70%" }}
                                    size = "middle"
                                >
                                    Save Username
                                </Button>
                                <Button
                                    onClick={() => router.back()}
                                    style={{ width: "70%" }}
                                    size = "middle"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </div>
            </div>
    );
};

export default EditUsername;
