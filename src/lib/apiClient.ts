import { CONFIG } from "@/config";

class ApiClient {
  private get baseURL() {
    return CONFIG.API_URL;
  }

  private async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = path.startsWith("http") ? path : `${this.baseURL}${path}`;
    
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      credentials: "include",
      ...options,
      headers,
    };

    const response = await fetch(url, config);

    if (response.status === 401) {
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { error: `HTTP error! status: ${response.status}` };
      }
      throw new Error(
        parsedError.error || 
        parsedError.message || 
        `Request failed with status ${response.status}`
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    
    return response.text() as any;
  }

  public get<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  public post<T = any>(path: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public put<T = any>(path: string, body?: any, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  }

  public delete<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
