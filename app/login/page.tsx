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

  const handleSignUp = () => {
    router.push("/register"); // adjust if your sign-up page is elsewhere
  };

  return (
    <div className="page-background">
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
            <Input.Password
              placeholder="Enter password"
              className="bg-white text-black"
            />
          </Form.Item>

          <Form.Item>
  <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
    <Button
      type="primary"
      htmlType="submit"
      loading={loading}
      style={{ flex: 1 }}
    >
      Login
    </Button>
    <Button
      onClick={handleBackToStart}
      className="back-button"
      style={{ flex: 1 }}
    >
      Back to Start Page
    </Button>
  </div>
</Form.Item>
        </Form>
       {/* Sign up button under the form */}
       <div className="mt-4 text-center">
          <Button type="default" onClick={handleSignUp}>
            Sign up
          </Button>
        </div>
      </div>
    </div>
  );
}; 
      

export default Login;