# Triya.ai Website

The official website for Triya.ai - an Edge AI-powered surveillance platform designed for the Middle East market.

## 🚀 Features

- **Bilingual Support**: Full Arabic and English language support with RTL layout
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Dynamic Content**: Industry-specific use cases with real-world examples
- **Modern Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Smooth Animations**: Engaging user experience with Framer Motion
- **SEO Optimized**: Server-rendered pages with structured metadata and an auto-generated sitemap

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Shadcn UI components
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Font**: DM Sans (custom variable font)

## 📁 Project Structure

```
triya-website/
├── app/                    # Next.js app directory
│   ├── use-cases/         # Industry-specific pages
│   ├── about/             # Company information
│   ├── contact/           # Contact page
│   └── layout.tsx         # Root layout with font config
├── components/            # Reusable components
│   ├── shared/           # Shared components (navbar, footer)
│   ├── sections/         # Page sections
│   └── ui/               # Shadcn UI components
├── lib/                   # Utility functions
├── public/               # Static assets
│   ├── fonts/            # DM Sans font files
│   └── images/           # Images and logos
└── styles/               # Global styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/triya-org/triya-website.git

# Navigate to the project directory
cd triya-website

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

### Building for Production

```bash
# Build the production app
npm run build

# Serve the production build locally
npm run start
```

## 🌐 Deployment

The site is deployed on [Vercel](https://vercel.com) as a server-rendered Next.js app:

1. Push changes to the `main` branch
2. Vercel automatically builds and deploys to production
3. The site is available at [https://www.triya.ai](https://www.triya.ai)

### Custom Domain Setup

The custom domain `www.triya.ai` is configured in the Vercel project settings, with a CNAME record for `www` pointing to Vercel DNS.

## 🔧 Configuration

### Environment Variables

No environment variables are required for the basic setup.

### Customization

- **Colors**: Edit the theme in `tailwind.config.ts`
- **Fonts**: Update font configuration in `app/layout.tsx`
- **Content**: Modify page content in respective component files

## 📱 Features Overview

### Homepage
- Hero section with video background
- Product features showcase
- Industry use cases
- How it works section
- Call-to-action sections

### Industry Pages
- Manufacturing
- Retail
- Healthcare
- Smart Cities
- Events (including Abu Dhabi case study)

### Company Pages
- About Us
- Contact

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by Triya.ai.

## 📞 Contact

For questions or support, please contact:
- Email: info@triya.ai
- Website: [www.triya.ai](https://www.triya.ai)
