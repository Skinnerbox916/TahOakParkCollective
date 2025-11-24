interface SocialMediaLinksProps {
  socialMedia: Record<string, string>;
}

const SOCIAL_PLATFORMS = [
  { key: "facebook", label: "Facebook", icon: "📘" },
  { key: "instagram", label: "Instagram", icon: "📷" },
  { key: "twitter", label: "Twitter", icon: "🐦" },
  { key: "linkedin", label: "LinkedIn", icon: "💼" },
  { key: "yelp", label: "Yelp", icon: "⭐" },
];

export function SocialMediaLinks({ socialMedia }: SocialMediaLinksProps) {
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
        Follow Us
      </h2>
      <div className="flex flex-wrap gap-3">
        {availableLinks.map((platform) => (
          <a
            key={platform.key}
            href={socialMedia[platform.key]}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium text-gray-700"
          >
            <span>{platform.icon}</span>
            <span>{platform.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}



