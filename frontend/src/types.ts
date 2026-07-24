export type Role = "ADMIN" | "USER";

export type AppUser = {
  id: number;
  username: string;
  role: Role;
};

export type Category = {
  id: number;
  name: string;
};
