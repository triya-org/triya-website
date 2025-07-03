# Triya.ai Website

The official website for Triya.ai - an Edge AI-powered surveillance platform designed for the Middle East market.

## 🚀 Features

- **Bilingual Support**: Full Arabic and English language support with RTL layout
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Dynamic Content**: Industry-specific use cases with real-world examples
- **Modern Stack**: Built with Next.js 14, TypeScript, and Tailwind CSS
- **Smooth Animations**: Engaging user experience with Framer Motion
- **SEO Optimized**: Static export for optimal performance and search visibility

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
# Build the static site
npm run build

# The output will be in the 'out' directory
```

## 🌐 Deployment

### GitHub Pages

The site is configured for automatic deployment to GitHub Pages:

1. Push changes to the `main` branch
2. GitHub Actions will automatically build and deploy the site
3. The site will be available at [https://www.triya.ai](https://www.triya.ai)

### Manual Deployment

To deploy manually to any static hosting service:

```bash
# Build the static site
npm run build

# The 'out' directory contains the static files
# Upload the contents to your hosting service
```

### Custom Domain Setup

The site is configured for the custom domain `www.triya.ai`:

1. The `CNAME` file in the `public` directory specifies the domain
2. Configure your domain's DNS to point to GitHub Pages:
   - Add a CNAME record for `www` pointing to `[your-github-username].github.io`
   - Add A records for the apex domain pointing to GitHub's IP addresses

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
