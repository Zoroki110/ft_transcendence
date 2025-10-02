// frontend_B/src/utils/storage.ts
// Service de stockage pour gérer les tokens de manière isolée par onglet

class StorageService {
  private readonly TOKEN_KEY = 'access_token';

  // Utilise sessionStorage au lieu de localStorage pour isoler les onglets
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  setToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
  }

  removeToken(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  // Méthode pour vérifier si un token existe
  hasToken(): boolean {
    return !!this.getToken();
  }

  // Méthode pour debug - voir quel token est utilisé
  debugToken(): void {
    const token = this.getToken();
    console.log('🔑 Current token:', token ? `${token.substring(0, 20)}...` : 'null');
  }
}

export const storageService = new StorageService();