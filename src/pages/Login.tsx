import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, LogIn, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login, register } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    try {
      if (isRegistering) {
        await register(email, password, name);
        toast.success("Compte créé avec succès !");
      } else {
        await login(email, password);
        toast.success("Connexion réussie !");
      }
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error("Email ou mot de passe incorrect.");
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error("Cet email est déjà utilisé.");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        toast.error("Une erreur est survenue. Veuillez réessayer.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold tracking-tight">Etablissement GRACE</CardTitle>
            <CardDescription className="text-base mt-2">
              {isRegistering 
                ? "Créez votre compte pour commencer." 
                : "Connectez-vous pour accéder à votre plateforme."}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom complet</Label>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="Jean Dupont" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@yetu.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit"
              className="w-full h-12 text-lg" 
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
              ) : isRegistering ? (
                <UserPlus className="w-5 h-5 mr-3" />
              ) : (
                <LogIn className="w-5 h-5 mr-3" />
              )}
              {isLoggingIn 
                ? (isRegistering ? "Création..." : "Connexion...") 
                : (isRegistering ? "S'inscrire" : "Se connecter")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-sm text-primary hover:underline font-medium"
            >
              {isRegistering 
                ? "Déjà un compte ? Se connecter" 
                : "Pas encore de compte ? S'inscrire"}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            En continuant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
