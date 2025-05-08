"use client";

import "@ant-design/v5-patch-for-react-19";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Button, App } from "antd";
import { useApi } from "@/hooks/useApi";
import { calculateHash } from "@/utils/hash";

const EditPassword: React.FC = () => {
    const router = useRouter();
    const apiService = useApi();

    const { message } = App.useApp();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
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

            const hashedOldPassword = await calculateHash(oldPassword);
            const hashedNewPassword = await calculateHash(newPassword);

            await apiService.put<void>(
                `/users/${userId}/password`,
                {
                    oldPassword: hashedOldPassword,
                    newPassword: hashedNewPassword,
                },
                {
                    Authorization: `Bearer ${token}`,
                }
            );

            message.success("Password updated successfully!");
            router.push(`/mainpage`);
        } catch (error: any) {
            message.error(error.message || "Failed to update password.");
        }
    };

    if (authorized === null) {
        return null;
    }

    return (
            <div
                className="min-h-screen flex items-center justify-center text-white text-center px-4 py-12"
                style={{
                    background:
                        "linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)",
                }}
            >
                <div
                    className="login-container"
                    style={{
                        maxWidth: "325px",
                        width: "100%",
                        margin: "0 auto",
                        padding: "2rem",
                        backgroundColor: "white",
                        borderRadius: "12px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 1)",
                    }}
                >
                    <h2 className="text-3xl font-semibold text-center mb-4 text-black">Change Password</h2>

                    <Form
                        name="edit-password"
                        size="large"
                        onFinish={handleUpdate}
                        layout="vertical"
                    >
                        <Form.Item
                            label={<div className="text-black text-center mb-1">Old Password</div>}
                            required
                            style={{ display: "flex", justifyContent: "center" }}
                        >
                            <Input.Password
                                placeholder="Enter current password"
                                className="bg-white text-black"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item
                            name="newPassword"
                            label={<div className="text-black text-center mb-1">New Password</div>}
                            required
                            style={{ display: "flex", justifyContent: "center" }}
                            rules={[
                                { required: true, message: "Please input your password!" },
                                { min: 8, message: "Password must be at least 8 characters" },
                                { max: 15, message: "Password must be no more than 15 characters" },
                                {
                                    validator: (_, value) =>
                                        value && /\s/.test(value)
                                            ? Promise.reject("Password cannot contain spaces")
                                            : Promise.resolve(),
                                },
                            ]}
                        >
                            <Input.Password
                                placeholder="Enter new password"
                                className="bg-white text-black"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                        </Form.Item>

                        <Form.Item>
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    style={{ width: "70%" }}
                                    size="middle"
                                >
                                    Save Password
                                </Button>
                                <Button
                                    onClick={() => router.back()}
                                    style={{ width: "70%" }}
                                    size="middle"
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

export default EditPassword;
