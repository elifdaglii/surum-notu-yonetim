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

export type ReleaseNote = {
  id: number;
  version: string;
  releaseDate: string;
  contentMarkdown: string;
  category: Category | null;
  createdByUsername: string | null;
  createdAt: string;
};
