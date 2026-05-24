import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function api<T = unknown>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const cookieToken = Cookies.get("accessToken");
  const activeToken = cookieToken || token;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      ...headers,
    },
    ...rest,
  });

  const data = await res.json();

  if (!res.ok) {
    // If unauthorized and it's not a refresh or login request, try to refresh the token
    if (res.status === 401 && endpoint !== "/auth/refresh" && endpoint !== "/auth/login") {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.accessToken;
          
          // Save the new token in cookies
          Cookies.set("accessToken", newAccessToken, { expires: 1 });

          // Retry the request with the new access token
          const retryRes = await fetch(`${API_BASE}${endpoint}`, {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newAccessToken}`,
              ...headers,
            },
            ...rest,
          });
          if (retryRes.ok) {
            return await retryRes.json() as T;
          }
        }
      } catch (err) {
        console.error("Silent token refresh failed:", err);
      }
    }
    throw new Error(data.error || `API error: ${res.status}`);
  }

  return data as T;
}

// For file uploads (no Content-Type header — let browser set boundary)
export async function apiUpload<T = unknown>(endpoint: string, formData: FormData, token?: string): Promise<T> {
  const cookieToken = Cookies.get("accessToken");
  const activeToken = cookieToken || token;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
    },
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error: ${res.status}`);
  return data as T;
}
