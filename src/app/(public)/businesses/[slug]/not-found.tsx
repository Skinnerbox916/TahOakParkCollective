import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          Business Not Found
        </h2>
        <p className="text-gray-600 mb-8">
          The business you&apos;re looking for doesn&apos;t exist or is no longer active.
        </p>
        <div className="flex gap-4 justify-center">
          <Button href="/">Back to Directory</Button>
        </div>
      </div>
    </div>
  );
}



