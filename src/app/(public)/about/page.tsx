import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About</h1>
          <p className="text-xl text-gray-600">
            TahOak Park Collective – Non-extractive, community-first discovery.
          </p>
        </div>

        <div className="space-y-6">
          {/* Mission Section */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TahOak Park Collective is a hyper-local discovery platform designed to help residents
              find genuinely local businesses, organizations, resources, public spaces, and key
              recurring community events.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Rather than prioritizing &quot;what&apos;s closest&quot; or &quot;highest SEO,&quot; we focus on <strong>real
              relationships to the neighborhood</strong>: where owners live, where activities actually
              happen, and who explicitly focuses on and invests in our community.
            </p>
          </Card>

          {/* Inclusion Criteria */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inclusion Criteria</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We include entities that meet our definition of &quot;local&quot;:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4 ml-4">
              <li>
                <strong>Presence:</strong> Physically operates in the coverage area (brick-and-mortar
                address, recurring pop-up location, or resident home-based service)
              </li>
              <li>
                <strong>Contribution:</strong> Provides life infrastructure, social places, support/equity,
                or ecosystem support to the community
              </li>
              <li>
                <strong>Standards:</strong> Meets community safety/inclusion standards
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              <strong>What we exclude:</strong> National and regional chains are completely excluded.
              This is a directory for genuinely local entities that have a real connection to our
              neighborhoods.
            </p>
          </Card>

          {/* Credits */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Credits</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              TahOak Park Collective is built and maintained by{" "}
              <a
                href="https://canopydigital.services"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Canopy Digital Services
              </a>{" "}
              and neighborhood volunteers.
            </p>
            <p className="text-gray-700 leading-relaxed">
              This project serves as both a community resource and a portfolio piece demonstrating
              product design, UX, and local hosting capabilities.
            </p>
          </Card>

          {/* Contact Section */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback & Inquiries</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              Have questions, suggestions, or want to report an issue? We&apos;d love to hear from you.
            </p>
            <Button href="/contact" className="w-full sm:w-auto">
              Contact Us
            </Button>
          </Card>
        </div>
      </main>
    </div>
  );
}

