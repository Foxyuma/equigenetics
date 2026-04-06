import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Check, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const PACKAGES = [
  { id: 'p1', label: '100 Crédits', credits: 100, price: '3,99 €', rate: 'RATE_100', popular: false },
  { id: 'p2', label: '300 Crédits', credits: 300, price: '8,99 €', rate: 'RATE_300', popular: true },
  { id: 'p3', label: '700 Crédits', credits: 700, price: '17,99 €', rate: 'RATE_700', popular: false },
  { id: 'p4', label: '1500 Crédits', credits: 1500, price: '39,99 €', rate: 'RATE_1500', popular: false },
];

export default function BuyCredits() {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [success, setSuccess] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => base44.auth.me(),
  });

  const handleValidateCode = async () => {
    if (!code.trim() || !selectedPackage) return;
    setValidating(true);

    // Dedipass code validation via their public API
    // Replace PUBLIC_KEY with your Dedipass public key
    const publicKey = import.meta.env.VITE_DEDIPASS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
    const url = `https://api.dedipass.com/v1/pay/?public_key=${publicKey}&rate=${selectedPackage.rate}&code=${code.trim()}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'success') {
      const newBalance = (user?.credits_balance ?? 0) + selectedPackage.credits;
      await base44.auth.updateMe({ credits_balance: newBalance });
      await base44.entities.Transaction.create({
        user_email: user.email,
        currency: 'credits',
        amount: selectedPackage.credits,
        balance_after: newBalance,
        reason: `Achat de crédits - ${selectedPackage.label}`,
      });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setSuccess(true);
      toast.success(`+${selectedPackage.credits} crédits ajoutés !`);
    } else {
      toast.error('Code invalide ou déjà utilisé. Veuillez réessayer.');
    }
    setValidating(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link to="/Profile" className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-800 transition-colors">
        <ArrowLeft className="w-4 h-4" />Retour
      </Link>

      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-200 mb-2">
          <Sparkles className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-stone-800">Acheter des Crédits</h1>
        <p className="text-stone-500">Solde actuel : <span className="font-bold text-violet-600">{user?.credits_balance ?? 0} ✦</span></p>
      </div>

      {success ? (
        <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 text-center">
          <CardContent className="p-10 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800">Paiement validé !</h2>
            <p className="text-green-700">+{selectedPackage.credits} crédits ont été ajoutés à votre compte.</p>
            <Button onClick={() => { setSuccess(false); setSelectedPackage(null); setCode(''); }} variant="outline">
              Acheter plus de crédits
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Step 1: Choose package */}
          <div>
            <p className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">1. Choisissez votre offre</p>
            <div className="grid grid-cols-2 gap-3">
              {PACKAGES.map(pkg => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
                    selectedPackage?.id === pkg.id
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-stone-200 bg-white hover:border-violet-200'
                  }`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-2.5 right-3 bg-violet-500 text-white border-0 text-xs">Populaire</Badge>
                  )}
                  <p className="text-lg font-bold text-stone-800">{pkg.label}</p>
                  <p className="text-2xl font-extrabold text-violet-600 mt-1">{pkg.price}</p>
                  {selectedPackage?.id === pkg.id && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Pay via Dedipass */}
          {selectedPackage && (
            <Card className="border-0 bg-white/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-stone-700">2. Payez via Dedipass</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-200">
                  <AlertTriangle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Rendez-vous sur <strong>dedipass.com</strong>, sélectionnez l'offre correspondant à <strong>{selectedPackage.label}</strong>, effectuez le paiement et entrez le code reçu ci-dessous.
                  </p>
                </div>

                <a
                  href="https://www.dedipass.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg">
                    Payer {selectedPackage.price} sur Dedipass →
                  </Button>
                </a>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Enter code */}
          {selectedPackage && (
            <Card className="border-0 bg-white/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-stone-700">3. Entrez votre code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Code reçu après paiement..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="text-center font-mono text-lg tracking-widest"
                />
                <Button
                  onClick={handleValidateCode}
                  disabled={!code.trim() || validating}
                  className="w-full bg-stone-800 hover:bg-stone-900"
                >
                  {validating ? 'Validation...' : 'Valider le code'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}