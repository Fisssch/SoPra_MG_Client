"use client";
export const dynamic = "force-dynamic";

import { Suspense } from "react";
import "@ant-design/v5-patch-for-react-19";
import { useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input } from "antd";
import { useState } from "react"; 

interface UserDTO {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams.get("message");
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { set: setToken } = useLocalStorage<string>("token", ""); //to set a token to local storage
  const { set: setUserId } = useLocalStorage<string>("id", ""); //to set a ID in the local storage

  const handleLogin = async (values: UserDTO) => {
    setLoading(true);
    try {
      // Make raw request to access headers
      const { data: user, headers } = await apiService.post<User>("/users/login", values);
  
      const authHeader = headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        setToken(token);
      }
     
      if (user?.id) {
        setUserId(String(user.id));
        alert("Login successful!");
        router.push("/users");
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
    <div className="login-container">
      {message && (
        <div
          style={{
            backgroundColor: "#ffefef",
            padding: "1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            color: "#b00020",
          }}
        >
          {message} 
        </div>
      )}
      <Form
        form={form}
        name="login"
        size="large"
        variant="outlined"
        onFinish={handleLogin}
        layout="vertical"
      >
        <Form.Item
          name="username"
          label="Username"
          rules={[{ required: true, message: "Please input your username!" }]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input placeholder="Enter password" />
        </Form.Item>
        <Form.Item>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <Button type="primary" htmlType="submit" loading={loading}>
            Login
          </Button>
          <Button onClick={handleBackToStart} className="back-button">
        Back to Start Page
      </Button>
      </div>
        </Form.Item>
      </Form>
      
    </div>
  );
}


export default Login;
