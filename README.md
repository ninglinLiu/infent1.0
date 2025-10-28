# Cyberpunk AI Landing Page

A stunning cyberpunk-styled landing page built with Next.js 14, TypeScript, Tailwind CSS, Framer Motion, and Three.js.

## Features

- 🎨 **Cyberpunk Aesthetic**: Dark theme with neon accents (cyan, magenta, purple)
- 🌍 **Bilingual Support**: English and Chinese language switching
- 📱 **Fully Responsive**: Mobile-first design with desktop enhancements
- ✨ **Smooth Animations**: Framer Motion powered transitions and effects
- 🎭 **Interactive 3D**: Three.js backgrounds and visualizations
- 📊 **Data Visualization**: KPI dashboards and risk radar charts
- 🚀 **Production Ready**: Optimized for Vercel deployment

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS Variables
- **Animations**: Framer Motion
- **3D Graphics**: Three.js
- **Charts**: Recharts
- **UI Components**: Radix UI (via shadcn/ui)
- **Icons**: Lucide React

## Getting Started

### Installation

```bash
# Clone the repository
git clone <your-repo-url>

# Install dependencies
npm install
# or
pnpm install

# Run development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm run start
```

## Project Structure

```
/
├── app/
│   ├── layout.tsx          # Root layout with language provider
│   ├── page.tsx             # Main landing page
│   ├── globals.css          # Global styles and cyberpunk theme
│   └── api/
│       └── feedback/        # Contact form API endpoint
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── NeonHeader.tsx       # Navigation header
│   ├── HeroGlitchTitle.tsx  # Glitched title effect
│   ├── HoloCard.tsx         # Holographic card component
│   ├── ArchitectureScene.tsx # 3D architecture visualization
│   ├── MetricsPanel.tsx     # KPI dashboard
│   ├── RiskRadar.tsx        # Risk visualization
│   ├── TimelineRoadmap.tsx  # Product roadmap
│   ├── FAQ.tsx              # Accordion FAQ
│   ├── ContactForm.tsx      # Contact form
│   ├── UseCases.tsx         # Use case cards
│   ├── KeyModules.tsx       # Feature modules
│   ├── ProblemSolution.tsx  # Problem/solution section
│   └── FooterCRT.tsx        # Footer with CRT scanline effect
├── content/
│   ├── project.json         # Main content (bilingual)
│   └── kpis.json            # KPI data and chart data
├── lib/
│   ├── language-context.tsx # Language switching context
│   └── utils.ts             # Utility functions
└── public/                  # Static assets
```

## Content Management

All text content is managed through JSON files in `/content`:

### `/content/project.json`

This file contains:
- Project title (bilingual)
- Problem statement
- Solution description
- Key modules
- Use cases
- Roadmap
- FAQ

### `/content/kpis.json`

Contains:
- Metric values (VaR, Sharpe, Drawdown, etc.)
- Chart data
- Risk radar data

To modify content, edit these JSON files directly. The site will update automatically on rebuild.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy

### Manual Build

```bash
npm run build
```

The output will be in `.next/` directory.

## Customization

### Colors

Edit `app/globals.css` to customize neon colors:

```css
--neon-cyan: #00ffff;
--neon-magenta: #ff00ff;
--neon-purple: #a855f7;
```

### Animations

Adjust animation durations and effects in component files using Framer Motion props.

### 3D Scene

Modify `components/ArchitectureScene.tsx` to customize the Three.js scene.

## Performance

- Three.js scenes use `IntersectionObserver` for lazy loading
- Images are optimized with Next.js Image component
- Framer Motion animations respect `prefers-reduced-motion`
- Mobile devices get simplified 3D renderings

## License

MIT License - feel free to use this project for your own purposes.

## Credits

Built with ❤️ using Next.js, Tailwind CSS, Framer Motion, and Three.js.
