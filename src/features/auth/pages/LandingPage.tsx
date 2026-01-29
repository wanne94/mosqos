import { Link } from 'react-router-dom'
import {
  Users,
  DollarSign,
  GraduationCap,
  FileText,
  Plane,
  Scissors,
  Heart,
  Globe,
} from 'lucide-react'

const features = [
  {
    icon: Users,
    title: 'Member Management',
    description: 'Track members, households, and community demographics with ease.',
  },
  {
    icon: DollarSign,
    title: 'Donations & Zakat',
    description: 'Manage donations, recurring giving, pledges, and Zakat calculations.',
  },
  {
    icon: GraduationCap,
    title: 'Education',
    description: 'Run classes, track attendance, manage enrollments and grades.',
  },
  {
    icon: FileText,
    title: 'Service Cases',
    description: 'Handle community assistance requests with KPI tracking.',
  },
  {
    icon: Plane,
    title: 'Umrah Management',
    description: 'Organize Umrah trips, manage pilgrims, track visas and payments.',
  },
  {
    icon: Scissors,
    title: 'Qurbani',
    description: 'Annual Qurbani campaigns with share registration and distribution.',
  },
  {
    icon: Heart,
    title: 'Islamic Services',
    description: 'Nikah, Janazah, and Shahada certificate management.',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Full support for English, Arabic (RTL), and Turkish.',
  },
]

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6">
            Modern Mosque Management
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The all-in-one platform to manage your mosque community, donations,
            education programs, and Islamic services.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="border border-primary text-primary px-8 py-3 rounded-lg font-medium hover:bg-primary/5 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            Everything Your Mosque Needs
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            From member management to Qurbani distribution, MosqOS provides all the
            tools to run your community efficiently.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-xl border bg-card hover:shadow-md transition"
                >
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Mosque?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join hundreds of mosques already using MosqOS to better serve their
            communities.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-primary px-8 py-3 rounded-lg font-medium hover:opacity-90 transition"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}
