import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy endpoint for Umami tracking script
 * This allows the script to be served from the same domain as the site,
 * avoiding mixed content issues and making it publicly accessible
 */
export async function GET(request: NextRequest) {
  try {
    const internalUrl = process.env.UMAMI_INTERNAL_URL || "http://umami:3000";
    
    // Fetch the script from Umami internally
    const scriptResponse = await fetch(`${internalUrl}/script.js`, {
      method: "GET",
      headers: {
        "Accept": "application/javascript",
      },
      cache: "no-store", // Always get the latest version
    });

    if (!scriptResponse.ok) {
      return new NextResponse("Script not found", { status: 404 });
    }

    let scriptText = await scriptResponse.text();
    
    // Rewrite API endpoints in the script to use our proxy
    // Umami script tries to send to /api/send, /api/collect, etc.
    // We need to rewrite these to use our proxy: /api/umami/send, /api/umami/collect
    scriptText = scriptText.replace(
      /(['"])\/api\/(send|collect|ping|track)/g,
      '$1/api/umami/$2'
    );
    // Also handle cases where it might use the full URL
    scriptText = scriptText.replace(
      /(['"])(https?:\/\/[^'"]+)?\/api\/(send|collect|ping|track)/g,
      '$1/api/umami/$3'
    );
    
    // Return the script with proper headers
    return new NextResponse(scriptText, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Error proxying Umami script:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
