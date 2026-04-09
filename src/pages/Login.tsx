import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Building2, LogIn, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { signIn } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSignIn = async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    try {
      await signIn();
    } catch (error: any) {
      toast.error("Erreur lors de la connexion. Veuillez réessayer.");
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
            <CardTitle className="text-3xl font-bold tracking-tight">Etablissement YETU</CardTitle>
            <CardDescription className="text-base mt-2">
              Connectez-vous pour accéder à votre plateforme de gestion immobilière.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Button 
            className="w-full h-12 text-lg" 
            onClick={handleSignIn}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <Loader2 className="w-5 h-5 mr-3 animate-spin" />
            ) : (
              <LogIn className="w-5 h-5 mr-3" />
            )}
            {isLoggingIn ? "Connexion en cours..." : "Se connecter avec Google"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-6">
            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
