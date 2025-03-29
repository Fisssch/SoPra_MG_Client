export interface User {
  id: number;
  username: string;
  token: string|null;
  onlineStatus: "ONLINE" | "OFFLINE" | string;
  wins: number;
  losses: number;
  blackCardGuesses: number;
}