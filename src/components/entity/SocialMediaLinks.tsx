import type { IconType } from "react-icons";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaLinkedinIn,
  FaYelp,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import { SiThreads } from "react-icons/si";
import { cn } from "@/lib/utils";

interface SocialMediaLinksProps {
  socialMedia: Record<string, string>;
  title?: string;
  opensInNewTabText?: string;
}

const SOCIAL_PLATFORMS: Array<{
  key: string;
  label: string;
  Icon: IconType;
}> = [
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "twitter", label: "Twitter", Icon: FaTwitter }, // Keep bird icon
  { key: "linkedin", label: "LinkedIn", Icon: FaLinkedinIn },
  { key: "yelp", label: "Yelp", Icon: FaYelp },
  { key: "tiktok", label: "TikTok", Icon: FaTiktok },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "threads", label: "Threads", Icon: SiThreads },
];

export function SocialMediaLinks({
  socialMedia,
  title,
  opensInNewTabText = "opens in new tab",
}: SocialMediaLinksProps) {
  if (!socialMedia || Object.keys(socialMedia).length === 0) {
    return null;
  }

  const availableLinks = SOCIAL_PLATFORMS.filter(
    (platform) => socialMedia[platform.key]
  );

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {title ?? "Social Media"}
      </h2>
      <div className="flex flex-wrap gap-2">
        {availableLinks.map((platform) => (
          <a
            key={platform.key}
            href={socialMedia[platform.key]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${platform.label} (${opensInNewTabText})`}
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-md",
              "bg-gray-50 text-gray-700 hover:bg-gray-100 focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
            )}
          >
            <platform.Icon
              className="h-5 w-5"
              aria-hidden="true"
              focusable="false"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

