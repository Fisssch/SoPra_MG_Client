"use client";

import "@ant-design/v5-patch-for-react-19";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Button, Form, Input } from "antd";
import { useState } from "react";
import { User } from "@/types/user";

interface UserDTO {
  username: string;
  password: string;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("id", "");
  const handleRegister = async (values: UserDTO) => {
    setLoading(true);

    try {
      const { data: user, headers } = await apiService.post<User>("/users", values);

      const authHeader = headers.get("Authorization");
      console.log("Authorization Header:", authHeader); 
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        setToken(token);
      }

      if (user?.id) {
        setUserId(String(user.id));
        alert("Registration successful!");
        router.push("/mainpage");
}

    } catch (error: any) {
      alert(`Registration failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };
  

  const handleBackToStart = () => {
    router.push("/");
  };

  return (
    <div className="page-background">
    <div className="login-container">
      <Form
        form={form}
        name="register"
        size="large"
        onFinish={handleRegister}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label={<span className="text-black">Username</span>}
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-black">Password</span>}
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password placeholder="Enter password" />
        </Form.Item>

        <Form.Item>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              Register
            </Button>
            <Button onClick={handleBackToStart}>
              Back to Start Page
            </Button>
          </div>
        </Form.Item>
      </Form>
    </div>
    </div>
  );
};
export default Register;