/** Tipos de domínio do Autec. */
export type Role = 'admin' | 'user';

export interface User {
  id: number;
  orgId: number;
  name: string;
  email: string;
  role: Role;
  initials: string;
  active: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserWithHash extends User {
  passwordHash: string;
}

/** Usuário autenticado presente em cada requisição. */
export interface AuthUser {
  id: number;
  orgId: number;
  role: Role;
  email: string;
}

export interface FolderNode {
  id: string;
  name: string;
  icon?: string;
  createdAt?: string;
  children: FolderNode[];
}

/**
 * Documento do contrato. O front-end envia o objeto completo; campos conhecidos
 * são tipados e o restante é preservado sem perda.
 */
export interface ContractDocument {
  id: string;
  name: string;
  type?: string;
  contractType?: 'Principal' | 'Aditivo' | 'Distrato' | string;
  startDate?: string;
  endDate?: string;
  value?: string;
  parentId?: string;
  processing?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

/** Formato do espaço de trabalho trocado com o front-end. */
export interface Workspace {
  rev: number;
  folders: FolderNode[];
  files: Record<string, ContractDocument[]>;
  alerts: Record<string, number>;
}

export interface StoredFile {
  orgId: number;
  documentId: string;
  mime: string;
  size: number;
  originalName: string | null;
  storagePath: string;
  uploadedAt: string;
}
