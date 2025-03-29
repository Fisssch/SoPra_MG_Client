"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { App, Form, Input, Button, message } from "antd";
import { useApi } from "@/hooks/useApi";

const EditUsername: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();

    const [newUsername, setNewUsername] = useState("");
    const [authorized, setAuthorized] = useState<boolean | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

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
        <App>
            <div className="page-background">
                <div className="login-container">
                    <h2 className="text-3xl font-semibold text-center mb-6 text-black">Change Username</h2>

                    <Form
                        name="edit-username"
                        size="large"
                        onFinish={handleUpdate}
                        layout="vertical"
                    >
                        <Form.Item
                            label={<span className="text-black">New Username</span>}
                            required
                        >
                            <Input
                                placeholder="Enter new username"
                                className="bg-white text-black"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{ flex: 1 }}
                                >
                                    Save Username
                                </Button>
                                <Button
                                    onClick={() => router.back()}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </App>
    );
};

export default EditUsername;
