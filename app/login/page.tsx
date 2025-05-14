"use client";
export const dynamic = "force-dynamic";

import "@ant-design/v5-patch-for-react-19";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { Button, Form, Input, App } from "antd";
import { calculateHash } from "@/utils/hash";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

interface UserDTO {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | null>(null);

  const {set: setToken} = useLocalStorage<string>("token", "");
  const {set: setUserId} = useLocalStorage<string>("id", "");

  const { message } = App.useApp();


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const msg = params.get("message");
    if (msg) {
      setInitialMessage(msg);
    }
  }, []);

  const handleLogin = async (values: UserDTO) => {
    setLoading(true);
    try {
      const hashedPassword = await calculateHash(values.password);

      const { data: user, headers } = await apiService.post<User>("/users/login", {
        username: values.username,
        password: hashedPassword,
      });

      const authHeader = headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        setToken(token);
      }

      if (user?.id) {
        setUserId(String(user.id));
        message.success("Login successful!");
        router.push("/mainpage");
      }
    } catch (error: any) {
      message.error(`Login failed: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStart = () => {
    router.push("/");
  };

  return (
      <div
          className="min-h-screen flex items-center justify-center text-white text-center px-4 py-12"
          style={{
            background: 'linear-gradient(to right, #8b0000 0%, #a30000 10%, #c7adc4 50%,#8cc9d7 70%, #367d9f 90%, #1a425a 100%)'
          }}
      >
        <div className="login-container">
          {initialMessage && (
              <div
                  style={{
                    backgroundColor: "#ffefef",
                    padding: "1rem",
                    borderRadius: "4px",
                    marginBottom: "1rem",
                    color: "#b00020",
                  }}
              >
                {initialMessage}
              </div>
          )}

          <h2 className="text-2xl font-semibold text-black mb-1!">Login to your account</h2>

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
                  iconRender={(visible) =>
                      visible ? (
                          <EyeOutlined style={{ color: "#ffffff" }} />
                      ) : (
                          <EyeInvisibleOutlined style={{ color: "#ffffff" }} />
                      )
                  }
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
                <Button type="primary" htmlType="submit" loading={loading} style={{ width: "70%"}}>
                  Login
                </Button>
                <Button onClick={handleBackToStart} className="back-button" style={{ width: "70%", fontSize: "0.95rem",}}>
                  Back to Start Page
                </Button>
              </div>
            </Form.Item>
          </Form>

          <div className="text-center mt-2">
            <p className="text-xs text-black mb-1">You don&apos;t have an account?</p>
            <a href="/register" className="text-blue-600 hover:underline font-medium text-sm">
              Sign up here
            </a>
          </div>
        </div>
      </div>
  );
};

export default Login;