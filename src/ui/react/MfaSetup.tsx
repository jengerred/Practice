'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MFACore } from '../../core/totp';

// Type safety for component props
interface MfaSetupProps {
  email: string;
  issuer: string;
  onVerified: (secret: string) => void;
}

export const MfaSetup = ({ email, issuer, onVerified }: MfaSetupProps) => {
  // State management with explicit types
  const [qrCode, setQrCode] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const initializeMfa = async () => {
      try {
        // Generate MFA secret with fallback values
        const { base32, otpauth_url } = MFACore.generateSecret(email, issuer);
        
        if (!isMounted) return;
        
        setSecret(base32);

        // Null check and fallback for QR code URL
        const qrUrl = otpauth_url ?? '';
        if (!qrUrl) throw new Error('Failed to generate QR code URL');

        // Generate QR code image
        const qrData = await MFACore.generateQRCode(qrUrl);
        if (!isMounted) return;

        setQrCode(qrData);
        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to initialize MFA setup. Please try again.');
        setIsLoading(false);
      }
    };

    initializeMfa();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [email, issuer]);

  const verify = () => {
    try {
      if (!MFACore.verifyCode(secret, code)) {
        throw new Error('Invalid verification code');
      }
      onVerified(secret);
    } catch (_err) { // <-- Properly ignored error
      setError('Verification failed');
    }
  };

  return (
    <div className="mfa-setup" role="region" aria-label="Multi-Factor Authentication Setup">
      {/* Loading state */}
      {isLoading && <p className="loading">Generating MFA credentials...</p>}

      {/* Error display */}
      {error && <p className="error" role="alert">{error}</p>}

      {/* QR Code display */}
      {qrCode && !isLoading && (
        <div className="qr-container">
          <Image
            src={qrCode}
            alt="Scan this QR code with your authenticator app"
            width={256}
            height={256}
            unoptimized // Required for data URLs
            aria-describedby="qr-instructions"
          />
          <p id="qr-instructions" className="sr-only">
            Open your authenticator app and scan this QR code to set up two-factor authentication
          </p>
        </div>
      )}

      {/* Verification input */}
      <input 
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="one-time-code"
        value={code}
        onChange={(e) => {
          // Validate input format
          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
          setCode(value);
          setError(''); // Clear error on input change
        }}
        placeholder="Enter 6-digit code"
        aria-label="Verification code"
        disabled={isLoading}
      />

      {/* Verification button */}
      <button 
        onClick={verify}
        disabled={isLoading || code.length !== 6}
        aria-busy={isLoading}
      >
        {isLoading ? 'Verifying...' : 'Enable MFA'}
      </button>
    </div>
  );
};
