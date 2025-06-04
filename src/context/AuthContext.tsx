import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'customer';
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: { name: string; email: string; password: string; phone: string }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  register: async () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in a real app, this would validate against a backend
    let user;
    
    if (email === 'admin@floreria.com' && password === 'admin123') {
      user = {
        id: '1',
        name: 'Administrador',
        email: 'admin@floreria.com',
        role: 'admin' as const
      };
    } else if (email === 'supervisor@floreria.com' && password === 'super123') {
      user = {
        id: '2',
        name: 'Supervisor',
        email: 'supervisor@floreria.com',
        role: 'supervisor' as const
      };
    } else {
      // Check registered users in localStorage
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const registeredUser = registeredUsers.find((u: any) => u.email === email && u.password === password);
      
      if (registeredUser) {
        user = {
          id: registeredUser.id,
          name: registeredUser.name,
          email: registeredUser.email,
          role: 'customer' as const,
          phone: registeredUser.phone
        };
      } else {
        return Promise.reject('Credenciales inválidas');
      }
    }

    setUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(user));

    // Redirect based on role
    if (user.role === 'admin') {
      navigate('/dashboard');
    } else if (user.role === 'supervisor') {
      navigate('/inventory');
    } else {
      navigate('/store');
    }
  };

  const register = async (userData: { name: string; email: string; password: string; phone: string }) => {
    const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Check if email already exists
    if (registeredUsers.some((u: any) => u.email === userData.email)) {
      return Promise.reject('El correo electrónico ya está registrado');
    }

    const newUser = {
      id: Date.now().toString(),
      ...userData,
      role: 'customer'
    };

    registeredUsers.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));

    // Auto login after registration
    await login(userData.email, userData.password);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};