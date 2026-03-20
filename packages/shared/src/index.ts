export type UserRole = "owner" | "editor" | "viewer";

export type DocumentPermission = "read" | "comment" | "write" | "admin";

export interface WsEvent<TPayload = unknown> {
  type: string;
  documentId: string;
  userId: string;
  payload: TPayload;
  timestamp: number;
}
