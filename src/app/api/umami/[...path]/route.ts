import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for Umami tracking API (send, collect, etc.)
 * This allows the tracking script to send data through our domain,
 * avoiding CORS issues and making it work from any access point
 */
export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  try {
    const internalUrl = process.env.UMAMI_INTERNAL_URL || "http://umami:3000";
    const path = request.nextUrl.pathname.replace("/api/umami/", "");
    
    // Build the Umami API URL
    // The script calls /api/umami/api/send, so path will be "api/send"
    // We need to forward to umami:3000/api/send (not /api/api/send)
    const umamiUrl = `${internalUrl}/${path}${request.nextUrl.search}`;
    
    console.log(`[Umami Proxy] ${request.method} ${request.nextUrl.pathname} -> ${umamiUrl}`);
    
    // Forward the request to Umami
    const method = request.method;
    const headers = new Headers();
    
    // Forward relevant headers
    request.headers.forEach((value, key) => {
      // Skip host and other headers that shouldn't be forwarded
      if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
        headers.set(key, value);
      }
    });

    const body = method === "POST" || method === "PUT" 
      ? await request.text() 
      : undefined;

    const response = await fetch(umamiUrl, {
      method,
      headers,
      body,
    });

    // Get response body
    const responseText = await response.text();
    
    // Return response with same status and headers
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error proxying Umami API:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  // Handle CORS preflight
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
