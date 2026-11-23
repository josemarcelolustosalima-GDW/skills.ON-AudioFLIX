/**
 * Native Mobile Facial Biometrics (WebAuthn / FIDO2 Platform Authenticator)
 * Enables Face ID (iOS Safari) and Facial Recognition / Biometrics (Android Chrome)
 * without storing plaintext passwords on the device.
 */

export interface BiometricDeviceBinding {
  credentialId: string;
  userId: string;
  userLogin: string;
  userName: string;
  rpId: string;
  deviceType: string;
  enabledAt: string;
  lastUsedAt?: string;
}

const STORAGE_KEY_BIOMETRICS = 'skills_on_biometrics_v1';

function uint8ArrayToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getSafeRpId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname;
  if (!host || /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(':')) {
    return undefined;
  }
  return host;
}

export function isMobileDeviceBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent || '');
}

export function getBiometricPlatformLabel(): string {
  if (typeof navigator === 'undefined') return 'Biometria Facial';
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'Face ID (iPhone / iOS)';
  if (/Android/i.test(ua)) return 'Biometria Facial (Android)';
  return 'Biometria do Dispositivo';
}

export function getStoredBiometricBindings(): BiometricDeviceBinding[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BIOMETRICS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
    return parsed.filter(
      (b: BiometricDeviceBinding) =>
        b &&
        typeof b.credentialId === 'string' &&
        typeof b.userId === 'string' &&
        (!b.rpId || !currentHost || b.rpId === currentHost)
    );
  } catch {
    return [];
  }
}

function saveStoredBiometricBindings(bindings: BiometricDeviceBinding[]) {
  try {
    localStorage.setItem(STORAGE_KEY_BIOMETRICS, JSON.stringify(bindings));
  } catch (err) {
    console.warn('Falha ao gravar configuração biométrica local:', err);
  }
}

export function getBiometricBindingForUser(userId: string): BiometricDeviceBinding | undefined {
  return getStoredBiometricBindings().find(b => b.userId === userId);
}

export function removeBiometricBindingForUser(userId: string): BiometricDeviceBinding[] {
  const updated = getStoredBiometricBindings().filter(b => b.userId !== userId);
  saveStoredBiometricBindings(updated);
  return updated;
}

export async function checkBiometricAvailability(): Promise<{
  supported: boolean;
  platformAvailable: boolean;
  isIframe: boolean;
  reason?: string;
}> {
  if (typeof window === 'undefined') {
    return { supported: false, platformAvailable: false, isIframe: false, reason: 'Ambiente sem navegador.' };
  }

  const isIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  if (!window.isSecureContext) {
    return {
      supported: false,
      platformAvailable: false,
      isIframe,
      reason: 'A biometria facial exige conexão segura HTTPS.',
    };
  }

  if (typeof window.PublicKeyCredential === 'undefined' || !navigator.credentials) {
    return {
      supported: false,
      platformAvailable: false,
      isIframe,
      reason: 'Este navegador não possui suporte nativo à API WebAuthn de biometria.',
    };
  }

  try {
    const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      supported: true,
      platformAvailable,
      isIframe,
      reason: platformAvailable
        ? undefined
        : 'Nenhum leitor facial ou biométrico nativo foi detectado neste dispositivo.',
    };
  } catch {
    return { supported: true, platformAvailable: false, isIframe };
  }
}

function formatWebAuthnError(err: unknown): string {
  const errorName = (err as { name?: string })?.name || '';
  const errorMsg = (err as { message?: string })?.message || '';

  if (errorName === 'NotAllowedError') {
    if (errorMsg.toLowerCase().includes('permissions policy') || errorMsg.toLowerCase().includes('feature')) {
      return 'O modo de visualização incorporado bloqueou a biometria. Abra o link publicado diretamente no navegador do seu celular (Safari ou Chrome).';
    }
    return 'A verificação biométrica foi cancelada ou expirou. Tente novamente quando estiver pronto.';
  }
  if (errorName === 'SecurityError') {
    return 'A biometria facial requer execução direta em domínio HTTPS (ex: link publicado no Netlify).';
  }
  if (errorName === 'InvalidStateError') {
    return 'Já existe uma credencial biométrica registrada para este usuário neste aparelho.';
  }
  if (errorName === 'NotSupportedError') {
    return 'Seu aparelho ou navegador não suporta autenticação biométrica nativa neste momento.';
  }
  return 'Não foi possível concluir a leitura da biometria facial neste aparelho.';
}

/**
 * Registers a platform WebAuthn credential (Face ID on iOS / Biometria Facial on Android)
 * Must be invoked directly inside a user click/tap handler for iOS Safari compatibility.
 */
export async function registerFacialBiometric(user: {
  id: string;
  login: string;
  name: string;
}): Promise<{ success: boolean; message: string; binding?: BiometricDeviceBinding }> {
  if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined' || !navigator.credentials) {
    return {
      success: false,
      message: 'Este navegador não suporta biometria facial nativa. Utilize Safari (iPhone) ou Chrome (Android).',
    };
  }

  if (!window.isSecureContext) {
    return {
      success: false,
      message: 'A biometria facial exige acesso via HTTPS.',
    };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(user.id);
    const rpId = getSafeRpId();

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'AUDIO SKILLS • skills.ON!',
        ...(rpId ? { id: rpId } : {}),
      },
      user: {
        id: userIdBytes,
        name: user.login,
        displayName: user.name || user.login,
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256 (iOS Secure Enclave & Android Keystore)
        { type: 'public-key', alg: -257 }, // RS256 fallback
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        requireResidentKey: false,
        userVerification: 'required',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions,
    })) as PublicKeyCredential | null;

    if (!credential || !credential.rawId) {
      return {
        success: false,
        message: 'Nenhuma credencial biométrica foi retornada pelo aparelho.',
      };
    }

    const credentialId = uint8ArrayToBase64Url(new Uint8Array(credential.rawId));
    const binding: BiometricDeviceBinding = {
      credentialId,
      userId: user.id,
      userLogin: user.login,
      userName: user.name,
      rpId: rpId || window.location.hostname,
      deviceType: getBiometricPlatformLabel(),
      enabledAt: new Date().toISOString(),
    };

    const existing = getStoredBiometricBindings().filter(b => b.userId !== user.id);
    saveStoredBiometricBindings([binding, ...existing]);

    return {
      success: true,
      message: `Biometria facial (${binding.deviceType}) habilitada com sucesso para ${user.name}!`,
      binding,
    };
  } catch (err) {
    console.warn('[BiometricAuth] Registration failed:', err);
    return {
      success: false,
      message: formatWebAuthnError(err),
    };
  }
}

/**
 * Authenticates the user using the device's native Face ID / Facial Biometrics
 * Must be invoked directly inside a user click/tap handler for iOS Safari compatibility.
 */
export async function authenticateWithFacialBiometric(
  preferredUserId?: string
): Promise<{ success: boolean; message?: string; binding?: BiometricDeviceBinding }> {
  const bindings = getStoredBiometricBindings();
  if (bindings.length === 0) {
    return {
      success: false,
      message: 'Nenhuma biometria facial está habilitada neste aparelho. Acesse primeiro com Login e Senha.',
    };
  }

  if (typeof window === 'undefined' || typeof window.PublicKeyCredential === 'undefined' || !navigator.credentials) {
    return {
      success: false,
      message: 'Seu navegador não suporta login por biometria facial. Entre com Login e Senha.',
    };
  }

  const targetBindings = preferredUserId
    ? bindings.filter(b => b.userId === preferredUserId)
    : bindings;
  const allowList = (targetBindings.length > 0 ? targetBindings : bindings).map(b => ({
    id: base64UrlToUint8Array(b.credentialId) as unknown as BufferSource,
    type: 'public-key' as const,
    transports: ['internal'] as AuthenticatorTransport[],
  }));

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const expectedChallengeB64 = uint8ArrayToBase64Url(challenge);
    const rpId = getSafeRpId();

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        ...(rpId ? { rpId } : {}),
        allowCredentials: allowList,
        userVerification: 'required',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion || !assertion.rawId) {
      return {
        success: false,
        message: 'Autenticação facial não concluída.',
      };
    }

    const response = assertion.response as AuthenticatorAssertionResponse;
    if (response?.clientDataJSON) {
      const clientDataText = new TextDecoder().decode(response.clientDataJSON);
      const clientData = JSON.parse(clientDataText);
      if (clientData.type !== 'webauthn.get' || clientData.challenge !== expectedChallengeB64) {
        return {
          success: false,
          message: 'Falha na validação criptográfica do desafio biométrico.',
        };
      }
    }

    const matchedCredentialId = uint8ArrayToBase64Url(new Uint8Array(assertion.rawId));
    const matchedBinding = bindings.find(b => b.credentialId === matchedCredentialId);
    if (!matchedBinding) {
      return {
        success: false,
        message: 'Credencial facial não reconhecida para este aplicativo.',
      };
    }

    const updatedBindings = bindings.map(b =>
      b.credentialId === matchedCredentialId
        ? { ...b, lastUsedAt: new Date().toISOString() }
        : b
    );
    saveStoredBiometricBindings(updatedBindings);

    return {
      success: true,
      binding: { ...matchedBinding, lastUsedAt: new Date().toISOString() },
    };
  } catch (err) {
    console.warn('[BiometricAuth] Authentication failed:', err);
    return {
      success: false,
      message: formatWebAuthnError(err),
    };
  }
}
