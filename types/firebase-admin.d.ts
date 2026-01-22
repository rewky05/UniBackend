declare module 'firebase-admin/app' {
  export interface App {
    name?: string;
  }
  
  export interface ServiceAccount {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  }
  
  export interface AppOptions {
    credential?: any;
    databaseURL?: string;
  }
  
  export function initializeApp(options?: AppOptions, name?: string): App;
  export function getApps(): App[];
  export function cert(serviceAccountPathOrObject: string | ServiceAccount): any;
}

declare module 'firebase-admin/auth' {
  export interface Auth {
    // Add methods as needed
  }
  
  export function getAuth(app?: any): Auth;
}

declare module '*.json' {
  const value: any;
  export default value;
}
