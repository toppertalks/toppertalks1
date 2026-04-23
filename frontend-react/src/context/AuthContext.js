import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import * as AuthService from "../lib/auth";

const AuthContext = createContext({
	user: null,
	accessToken: null,
	loading: false,
	initialized: false,
	isAuthenticated: false,
	error: null,
	login: async () => {},
	signup: async () => {},
	logout: async () => {},
	refreshSession: async () => {},
	verifyEmail: async () => {},
	requestPasswordReset: async () => {},
	resetPassword: async () => {},
	clearError: () => {},
	loadUserOnStartup: async () => {},
});

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [accessToken, setAccessTokenState] = useState(null);
	const [loading, setLoading] = useState(true);
	const [initialized, setInitialized] = useState(false);
	const [error, setError] = useState(null);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	const clearSession = useCallback(() => {
		setUser(null);
		setAccessTokenState(null);
		setError(null);
		AuthService.clearAuthState();
	}, []);

	const login = useCallback(
		async (email, password) => {
			setLoading(true);
			clearError();
			try {
				const payload = await AuthService.signInWithEmail(email, password);
				if (payload?.accessToken) {
					setAccessTokenState(payload.accessToken);
				}
				const profile = payload?.user ?? (await AuthService.fetchProfile());
				if (profile) {
					setUser(profile);
				}
				return payload;
			} catch (err) {
				const message =
					err?.response?.data?.message ||
					err?.response?.data?.error ||
					err?.message ||
					"Unable to sign in. Please try again.";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[clearError],
	);

	const signup = useCallback(
		async (name, email, password) => {
			setLoading(true);
			clearError();
			try {
				return await AuthService.signUpWithEmail(name, email, password);
			} catch (err) {
				const message =
					err?.response?.data?.message ||
					err?.response?.data?.error ||
					err?.message ||
					"Unable to create your account. Please try again.";
				setError(message);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[clearError],
	);

	const refreshSession = useCallback(async () => {
		setLoading(true);
		try {
			const payload = await AuthService.refresh();
			if (payload?.accessToken) {
				setAccessTokenState(payload.accessToken);
			}
			const profile = await AuthService.fetchProfile();
			setUser(profile);
			return payload;
		} catch (error) {
			clearSession();
			throw error;
		} finally {
			setLoading(false);
		}
	}, [clearSession]);

	const logout = useCallback(async () => {
		setLoading(true);
		try {
			await AuthService.signOut();
		} finally {
			clearSession();
			setLoading(false);
		}
	}, [clearSession]);

	const loadUserOnStartup = useCallback(async () => {
		setLoading(true);
		try {
			const payload = await AuthService.refresh();
			if (payload?.accessToken) {
				setAccessTokenState(payload.accessToken);
				const profile = await AuthService.fetchProfile();
				setUser(profile);
				return true;
			}
			return false;
		} catch (error) {
			clearSession();
			return false;
		} finally {
			setLoading(false);
			setInitialized(true);
		}
	}, [clearSession]);

	useEffect(() => {
		let isMounted = true;
		const initialize = async () => {
			await loadUserOnStartup();
			if (isMounted) {
				setInitialized(true);
			}
		};
		initialize();
		return () => {
			isMounted = false;
		};
	}, [loadUserOnStartup]);

	useEffect(() => {
		const handleAuthEvent = (event) => {
			if (event?.detail?.type === "logout") {
				clearSession();
				setInitialized(true);
				setLoading(false);
			}
		};
		const unsubscribe = AuthService.onAuthEvent(handleAuthEvent);
		return unsubscribe;
	}, [clearSession]);

	return (
		<AuthContext.Provider
			value={{
				user,
				accessToken,
				loading,
				initialized,
				isAuthenticated: Boolean(user),
				error,
				login,
				signup,
				logout,
				refreshSession,
				verifyEmail: AuthService.verifyEmail,
				requestPasswordReset: AuthService.sendPasswordReset,
				resetPassword: AuthService.resetPassword,
				clearError,
				loadUserOnStartup,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
