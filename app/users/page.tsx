// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Button, Card, Table, Badge, Tooltip } from "antd";
import type { TableProps } from "antd"; // antd component library allows imports of types
// Optionally, you can import a CSS module or file for additional styling:
// import "@/styles/views/Dashboard.scss";

// Columns for the antd table of User objects
const columns: TableProps<User>["columns"] = [
  {
    title: "Username",
    dataIndex: "username",
    key: "username",
  },
  {
    title: "Online Status",
    dataIndex: "onlineStatus",
    key: "onlineStatus",
    render: (status: string) => (
        <Tooltip title={status}>
          <Badge
              color={status === "ONLINE" ? "#52c41a" : "#ffffff"}
              text={status}
          />
        </Tooltip>
    ),
  },
];

const Dashboard: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const [users, setUsers] = useState<User[] | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  // useLocalStorage hook example use
  // The hook returns an object with the value and two functions
  // Simply choose what you need from the hook:
  useEffect(() => {
    const token = localStorage.getItem("token")?.replace(/^"|"$/g, "");
    if (!token) {
      router.replace("/?message=Please login first.");
    } else {
      setAuthorized(true);
    }
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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const rawToken = localStorage.getItem("token");
        const token = rawToken?.replace(/^"|"$/g, "");

        const users: User[] = await apiService.get<User[]>("/users", {
          Authorization: `Bearer ${token}`,
        });

        setUsers(users);
      } catch (error) {
        console.error("Error during loading of the users:", error);
      }
    };

    if (authorized) {
      fetchUsers();
    }
  }, [authorized, apiService]);

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
        <div className="card-container">
          <Card
              title="Overview of users"
              loading={!users}
              className="dashboard-container"
              style={{
                width: "325px",
                minHeight: "600px",
                margin: "0 auto",
              }}
          >
            {users && (
                <>
                  {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
                  <Table<User>
                      columns={columns}
                      dataSource={users}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                      onRow={(row) => ({
                        onClick: () => router.push(`/users/${row.id}`),
                        style: { cursor: "pointer" },
                      })}
                  />
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    alignItems: "center",
                    marginTop: "1px",
                  }}>
                    <Button onClick={handleLogout} type="primary" style={{ width: "70%" }}>
                      Logout
                    </Button>
                    <Button onClick={() => router.push('/mainpage')} type="default" style={{ width: "70%" }}>
                      Back to Home
                    </Button>
                  </div>
                </>
            )}
          </Card>
        </div>
      </div>
  );
};

export default Dashboard;