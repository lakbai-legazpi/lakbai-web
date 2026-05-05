'use client';

import React, { useEffect, useState, useContext, createContext } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowRight, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/app/(marketing)/_components/UserAuthModal';
import { createClient } from '@/lib/supabase/client';
import { TextBody } from '@/components/text';
import { UserAvatar } from '@/components/UserAvatar';
import { Toast } from '@/app/(app)/_components/Notificaiton';

type AuthView = 'login' | 'signup';
type ToastType = 'success' | 'error';
type SignUpStep = 'identity' | 'password' | 'username';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------------------
// Shared sub-components
// ---------------------------------------------------------------------------

function PasswordInput({
  id,
  value,
  onChange,
  placeholder = 'Enter your password',
  label
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className='space-y-2'>
      <TextBody className='font-semibold text-slate-600'>{label}</TextBody>
      <div className='relative'>
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={
            id === 'signup-password' ? 'new-password' : 'current-password'
          }
          className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 pr-12 transition-all outline-none focus:bg-white focus:ring-2'
        />
        <button
          type='button'
          onClick={() => setShow(s => !s)}
          className='absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600'
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}

function LoginForm({
  onSwitchToSignUp,
  onClose,
  onNotify
}: {
  onSwitchToSignUp: () => void;
  onClose: () => void;
  onNotify: (message: string, type?: ToastType) => void;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identifier.trim() || !password.trim()) {
      onNotify('Please fill in all fields.', 'error');
      return;
    }

    setLoading(true);
    try {
      const resolveRes = await fetch('/api/auth/resolve-identifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim() })
      });
      const resolveData = await resolveRes.json();

      if (!resolveRes.ok) {
        onNotify(resolveData.error ?? 'Invalid username or email.', 'error');
        return;
      }

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: resolveData.email,
        password
      });

      if (authError) {
        onNotify(authError.message, 'error');
        return;
      }

      await fetch('/api/auth/sync-user', { method: 'POST' });

      onNotify('Welcome back!', 'success');
      onClose();
      router.push('/chat');
      router.refresh();
    } catch {
      onNotify('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-5' noValidate>
      <div className='space-y-2'>
        <TextBody className='font-semibold text-slate-600'>
          Username or Email
        </TextBody>
        <input
          id='login-identifier'
          type='text'
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          placeholder='@lakbai-user or name@example.com'
          autoComplete='username'
          className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all outline-none focus:bg-white focus:ring-2'
        />
      </div>

      <PasswordInput
        id='login-password'
        label='Password'
        value={password}
        onChange={setPassword}
      />

      <button
        type='submit'
        disabled={loading}
        className='bg-primary-500 shadow-primary-500/30 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {loading ? (
          <Loader2 size={18} className='animate-spin' />
        ) : (
          <>
            Sign In <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className='text-center'>
        <TextBody className='text-slate-500'>
          New to Lakbai?{' '}
          <button
            type='button'
            onClick={onSwitchToSignUp}
            className='text-primary-500 font-bold hover:underline'
          >
            Create an account
          </button>
        </TextBody>
      </div>
    </form>
  );
}

function SignUpForm({
  onSwitchToLogin,
  onClose,
  onNotify
}: {
  onSwitchToLogin: () => void;
  onClose: () => void;
  onNotify: (message: string, type?: ToastType) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<SignUpStep>('identity');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNextStep = async () => {
    if (step === 'identity') {
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        onNotify('Please fill in first name, last name, and email.', 'error');
        return;
      }
      if (!emailRegex.test(email.trim())) {
        onNotify('Please enter a valid email address.', 'error');
        return;
      }
      setStep('password');
      return;
    }

    if (step === 'password') {
      if (!password || !confirmPassword) {
        onNotify('Please fill in password and confirm password.', 'error');
        return;
      }
      if (password.length < 6) {
        onNotify('Password must be at least 6 characters.', 'error');
        return;
      }
      if (password !== confirmPassword) {
        onNotify("Passwords don't match.", 'error');
        return;
      }
      setStep('username');
    }
  };

  const handleBackStep = () => {
    if (step === 'username') {
      setStep('password');
      return;
    }
    if (step === 'password') {
      setStep('identity');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step !== 'username') {
      await handleNextStep();
      return;
    }

    const rawUsername = username.trim().replace(/^@+/, '');
    if (!rawUsername) {
      onNotify('Username is required.', 'error');
      return;
    }

    setLoading(true);
    try {
      const usernameCheckRes = await fetch('/api/auth/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: rawUsername })
      });
      const usernameCheckData = await usernameCheckRes.json();
      if (!usernameCheckRes.ok) {
        onNotify(usernameCheckData.error ?? 'Invalid username.', 'error');
        return;
      }
      if (!usernameCheckData.available) {
        onNotify('Username is already taken.', 'error');
        return;
      }

      const supabase = createClient();
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/chat`;
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: fullName,
            username: usernameCheckData.username
          }
        }
      });

      if (authError) {
        onNotify(authError.message, 'error');
        return;
      }

      if (data.session) {
        await fetch('/api/auth/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            username: usernameCheckData.username
          })
        });

        onNotify('Account created successfully!', 'success');
        onClose();
        router.push('/chat');
        router.refresh();
        return;
      }

      onNotify(
        'Please check your email to confirm your account, then sign in.',
        'success'
      );
      onSwitchToLogin();
    } catch {
      onNotify('Something went wrong. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-5' noValidate>
      <div className='flex items-center justify-between'>
        <TextBody className='text-sm font-semibold text-slate-500'>
          Step {step === 'identity' ? 1 : step === 'password' ? 2 : 3} of 3
        </TextBody>
        {step !== 'identity' && (
          <button
            type='button'
            onClick={handleBackStep}
            className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700'
          >
            <ChevronLeft size={16} /> Back
          </button>
        )}
      </div>

      {step === 'identity' && (
        <div className='space-y-5'>
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <TextBody className='font-semibold text-slate-600'>
                First Name
              </TextBody>
              <input
                id='signup-first-name'
                type='text'
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder='Christian'
                autoComplete='given-name'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all outline-none focus:bg-white focus:ring-2'
              />
            </div>
            <div className='space-y-2'>
              <TextBody className='font-semibold text-slate-600'>
                Last Name
              </TextBody>
              <input
                id='signup-last-name'
                type='text'
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder='Morga'
                autoComplete='family-name'
                className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all outline-none focus:bg-white focus:ring-2'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <TextBody className='font-semibold text-slate-600'>Email</TextBody>
            <input
              id='signup-email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='name@example.com'
              autoComplete='email'
              className='focus:border-primary-500 focus:ring-primary-500/20 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all outline-none focus:bg-white focus:ring-2'
            />
          </div>
        </div>
      )}

      {step === 'password' && (
        <div className='space-y-5'>
          <PasswordInput
            id='signup-password'
            label='Password'
            value={password}
            onChange={setPassword}
            placeholder='At least 6 characters'
          />

          <PasswordInput
            id='signup-confirm-password'
            label='Confirm Password'
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder='Re-enter your password'
          />
        </div>
      )}

      {step === 'username' && (
        <div className='space-y-2'>
          <TextBody className='font-semibold text-slate-600'>Username</TextBody>
          <div className='focus-within:border-primary-500 focus-within:ring-primary-500/20 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 transition-all focus-within:ring-2'>
            <span className='text-slate-500'>@</span>
            <input
              id='signup-username'
              type='text'
              value={username.replace(/^@+/, '')}
              onChange={e => setUsername(e.target.value.replace(/^@+/, ''))}
              placeholder='lakbai-user'
              autoComplete='username'
              className='w-full bg-transparent p-4 pl-2 outline-none'
            />
          </div>
          <TextBody className='text-xs text-slate-500'>
            3-30 characters. Letters, numbers, dot, underscore, and hyphen only.
          </TextBody>
        </div>
      )}

      <button
        type='submit'
        disabled={loading}
        className='bg-primary-500 shadow-primary-500/30 flex w-full items-center justify-center gap-2 rounded-2xl py-4 font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60'
      >
        {loading ? (
          <Loader2 size={18} className='animate-spin' />
        ) : (
          <>
            {step === 'username' ? 'Create Account' : 'Continue'}{' '}
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className='text-center'>
        <TextBody className='text-slate-500'>
          Already have an account?{' '}
          <button
            type='button'
            onClick={onSwitchToLogin}
            className='text-primary-500 font-bold hover:underline'
          >
            Sign in
          </button>
        </TextBody>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Context + Provider
// ---------------------------------------------------------------------------

interface AuthContextValue {
  openLogin: () => void;
  openSignUp: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  openLogin: () => {},
  openSignUp: () => {}
});

// ---------------------------------------------------------------------------
// Public exports used in LandingPage
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<AuthView | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');
  const [isToastOpen, setIsToastOpen] = useState(false);

  const closeModal = () => setView(null);

  const handleNotify = (message: string, type: ToastType = 'error') => {
    setToastMessage(message);
    setToastType(type);
    setIsToastOpen(true);
    setTimeout(() => setIsToastOpen(false), 3200);
  };

  return (
    <AuthContext.Provider
      value={{
        openLogin: () => setView('login'),
        openSignUp: () => setView('signup')
      }}
    >
      {children}

      {/* Auth Modals */}
      <Modal
        isOpen={view === 'login'}
        onClose={closeModal}
        title='Welcome Back'
        subtitle='Sign in to continue your journey'
      >
        <LoginForm
          onSwitchToSignUp={() => setView('signup')}
          onClose={closeModal}
          onNotify={handleNotify}
        />
      </Modal>

      <Modal
        isOpen={view === 'signup'}
        onClose={closeModal}
        title='Join Lakbai'
        subtitle='Create your free account'
      >
        <SignUpForm
          onSwitchToLogin={() => setView('login')}
          onClose={closeModal}
          onNotify={handleNotify}
        />
      </Modal>

      <Toast
        isOpen={isToastOpen}
        message={toastMessage}
        type={toastType}
        onClose={() => setIsToastOpen(false)}
      />
    </AuthContext.Provider>
  );
}

/** Nav Buttons */
export function NavAuthButtons() {
  const { openLogin, openSignUp } = useContext(AuthContext);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [userProfile, setUserProfile] = useState<{
    email?: string | null;
    fullName?: string | null;
    username?: string | null;
    avatarSeed?: string | null;
    avatarOptions?: any;
  } | null>(null);

  useEffect(() => {
    let isActive = true;
    const supabase = createClient();

    const loadUser = async () => {
      setIsLoadingUser(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();

      if (!isActive) return;

      if (!user) {
        setUserProfile(null);
        setIsLoadingUser(false);
        return;
      }

      let profile = {
        email: user.email ?? null,
        fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
        username: (user.user_metadata?.username as string | undefined) ?? null,
        avatarSeed: null,
        avatarOptions: null
      };

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (data?.profile) {
            const fullName = [data.profile.firstName, data.profile.lastName]
              .filter(Boolean)
              .join(' ')
              .trim();
            profile = {
              email: data.profile.email ?? profile.email ?? null,
              fullName: fullName || data.profile.name || profile.fullName,
              username: data.profile.username ?? profile.username ?? null,
              avatarSeed: data.profile.avatarSeed ?? null,
              avatarOptions: data.profile.avatarOptions ?? null
            };
          }
        }
      } catch {
        // Fall back to auth metadata if profile fetch fails.
      }

      if (isActive) {
        setUserProfile(profile);
        setIsLoadingUser(false);
      }
    };

    loadUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoadingUser) {
    return null;
  }

  if (userProfile) {
    const displayName =
      userProfile.fullName ||
      (userProfile.username ? `@${userProfile.username}` : null) ||
      userProfile.email ||
      'Lakbai User';
    const displayUsername = userProfile.username
      ? `@${userProfile.username}`
      : null;

    return (
      <div className='flex items-center gap-3 md:gap-4'>
        <Link
          href='/chat'
          className='border-primary-500 text-primary-500 hover:bg-primary-50 rounded-full border px-4 py-2 text-sm font-semibold transition-colors'
        >
          Get Started
        </Link>
        <div className='flex items-center gap-3 rounded-full bg-slate-50 px-3 py-2'>
          <UserAvatar
            seed={userProfile.avatarSeed}
            options={userProfile.avatarOptions}
            className='h-9 w-9'
            size={72}
          />
          <div className='leading-tight'>
            <p className='text-text-main text-sm font-semibold'>
              {displayName}
            </p>
            {displayUsername && (
              <p className='text-text-muted text-xs'>{displayUsername}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-center gap-2 md:gap-4'>
      <button
        onClick={openLogin}
        className='hover:text-primary-500 text-text-main px-3 py-2 text-sm font-semibold transition-colors md:px-4'
      >
        Login
      </button>
      <button
        onClick={openSignUp}
        className='bg-primary-500 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-95 md:px-6'
      >
        Sign Up
      </button>
    </div>
  );
}

/** Footer Component */
export function FooterActions() {
  return (
    <div className='flex flex-col gap-3 md:text-right'>
      <Link
        href='/about'
        className='text-text-muted text-left font-medium transition-colors hover:text-slate-900 md:text-right'
      >
        About
      </Link>
      <Link
        href='/team'
        className='text-text-muted text-left font-medium transition-colors hover:text-slate-900 md:text-right'
      >
        Team
      </Link>
      <Link
        href='/contact'
        className='text-text-muted text-left font-medium transition-colors hover:text-slate-900 md:text-right'
      >
        Contact
      </Link>
    </div>
  );
}

/** Legal Component */
export function LegalActions() {
  return (
    <div className='flex items-center gap-4 md:gap-6'>
      <Link
        href='/privacy'
        className='text-text-muted hover:text-text-main text-sm font-medium transition-colors'
      >
        Privacy Policy
      </Link>
      <Link
        href='/terms'
        className='text-text-muted hover:text-text-main text-sm font-medium transition-colors'
      >
        Terms of Service
      </Link>
    </div>
  );
}

export function HeroCTA() {
  const { openSignUp } = useContext(AuthContext);
  return (
    <button
      onClick={openSignUp}
      className='group bg-primary-500 text-background flex items-center gap-3 rounded-full px-10 py-5 text-lg font-semibold hover:cursor-pointer hover:opacity-90'
    >
      Start your journey
    </button>
  );
}
