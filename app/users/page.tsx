// this code is part of S2 to display a list of all registered users
// clicking on a user in this list will display /app/users/[id]/page.tsx
"use client"; // For components that need React hooks and browser APIs, SSR (server side rendering) has to be disabled. Read more here: https://nextjs.org/docs/pages/building-your-application/rendering/server-side-rendering

import "@ant-design/v5-patch-for-react-19";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { User } from "@/types/user";
import { Button, Card, Table } from "antd";
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
    let token = localStorage.getItem('token');


    if (!token) {
      console.error('Missing token or username');
      return;
    }

    token = token.replace(/^"|"$/g, ''); // Removes leading and trailing quotes
    console.log("Token being sent to logout:", token); // Debugging output

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
        console.error("Error durig loading of the users:", error);
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
      <div className="page-background">
        <div className="card-container">
          <Card
              title="Overview of users"
              loading={!users}
              className="dashboard-container"
          >
            {users && (
                <>
                  {/* antd Table: pass the columns and data, plus a rowKey for stable row identity */}
                  <Table<User>
                      columns={columns}
                      dataSource={users}
                      rowKey="id"
                      onRow={(row) => ({
                        onClick: () => router.push(`/users/${row.id}`),
                        style: { cursor: "pointer" },
                      })}
                  />
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: "20px"
                  }}>
                    <Button onClick={handleLogout} type="primary">
                      Logout
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
                </>
            )}
          </Card>
        </div>
      </div>
  );
};

export default Dashboard;