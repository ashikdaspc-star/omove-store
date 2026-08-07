import { Product, RemoteService, BlogPost, Coupon, ProductCategory } from '../types';

export const CATEGORIES: { name: ProductCategory; icon: string; count: number; description: string }[] = [
  { name: 'Windows Tools', icon: 'Monitor', count: 0, description: 'Windows system tools, debloaters, activation & OS utilities' },
  { name: 'Software', icon: 'FileText', count: 0, description: 'Digital software applications, PC tools & productivity suites' }
];

export const MOCK_PRODUCTS: Product[] = [];

export const MOCK_SERVICES: RemoteService[] = [
  {
    id: 'srv-001',
    title: 'Remote PC Support',
    description: "Get secure remote support from certified technicians. We connect to your PC using AnyDesk and stay in touch through WhatsApp to diagnose, troubleshoot, and resolve your Windows or software issues quickly and safely.\n\nIf we're unable to resolve your issue, your payment will be automatically refunded within 2–3 business days.",
    price: 39,
    originalPrice: 499,
    category: 'Windows Fix',
    estimatedTime: '15 Mins',
    iconName: 'Search',
    popular: true,
    features: [
      'Direct Expert Support',
      'PC & Software Solutions',
      'Secure Remote Repair',
      'WhatsApp Support'
    ]
  }
];

export const MOCK_BLOGS: BlogPost[] = [
  {
    id: 'blog-001',
    title: 'How to Fix Windows 11 High CPU & RAM Usage in 2026',
    slug: 'fix-windows-11-high-cpu-ram-usage-2026',
    excerpt: 'Is Windows 11 feeling sluggish? Follow this step-by-step technical guide to disable hidden telemetry, system web search, and background bloatware.',
    content: `
# How to Fix Windows 11 High CPU & RAM Usage in 2026

Windows 11 introduces many visual improvements, but out of the box, background services like **SysMain**, **SearchIndexer**, and **Telemetry** can consume up to 4GB of RAM and causes random CPU spikes.

## Step 1: Disable Telemetry & Connected User Experiences
1. Press \`Win + R\`, type \`services.msc\` and hit Enter.
2. Locate **Connected User Experiences and Telemetry**.
3. Right-click > Properties > Set Startup Type to **Disabled** and stop the service.

## Step 2: Clear Temp Cache & Prefetch
Execute this quick PowerShell snippet as Administrator:

\`\`\`powershell
Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue
Clear-RecycleBin -Force -ErrorAction SilentlyContinue
\`\`\`

## Step 3: Remote PC Support
Need expert assistance? Book our Remote PC Support service for just ₹39 to have a certified technician optimize your system live!
`,
    author: 'Alex Rivera',
    authorRole: 'Senior Systems Expert',
    category: 'Windows Optimization',
    readTime: '5 min read',
    publishedAt: 'August 2, 2026',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
    tags: ['Windows 11', 'Optimization', 'PowerShell', 'PC Speed'],
    likes: 342
  },
  {
    id: 'blog-002',
    title: 'Troubleshooting BSOD Code: WHEA_UNCORRECTABLE_ERROR',
    slug: 'troubleshooting-bsod-whea-uncorrectable-error',
    excerpt: 'Demystifying the feared WHEA BSOD error. Learn how to identify hardware voltage issues, overheating, or corrupted PCIe drivers.',
    content: `
# Troubleshooting BSOD Code: WHEA_UNCORRECTABLE_ERROR

A \`WHEA_UNCORRECTABLE_ERROR\` indicates a hardware error detected by the Windows Hardware Error Architecture.

## Common Causes
- Overclocked CPU or insufficient core voltage
- Excessive CPU thermal throttling (85°C+)
- Faulty NVMe SSD controller
- Outdated BIOS firmware

## Resolution Steps
1. **Reset BIOS settings**: Boot into UEFI and restore default clocks.
2. **Check Drive SMART Health**: Use diagnostic tools to ensure your drive sectors aren't failing.
3. **Book Remote Repair**: Need an expert? Our certified technicians can analyze your Minidump files in under 20 minutes via AnyDesk!
`,
    author: 'David Chen',
    authorRole: 'Hardware & Diagnostic Lead',
    category: 'Repair Guides',
    readTime: '7 min read',
    publishedAt: 'July 28, 2026',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
    tags: ['BSOD', 'Hardware', 'Blue Screen', 'Diagnostics'],
    likes: 219
  }
];

export const MOCK_COUPONS: Coupon[] = [
  { code: 'OMOVE20', discountPercent: 20, maxDiscount: 50, minSpend: 10, validUntil: '2026-12-31', isActive: true },
  { code: 'WELCOME10', discountPercent: 10, maxDiscount: 20, minSpend: 0, validUntil: '2026-12-31', isActive: true },
  { code: 'FREELICENSE', discountPercent: 15, maxDiscount: 30, minSpend: 15, validUntil: '2026-12-31', isActive: true }
];
