import { Product, RemoteService, BlogPost, Coupon, ProductCategory } from '../types';

export const CATEGORIES: { name: ProductCategory; icon: string; count: number; description: string }[] = [
  { name: 'Windows Tools', icon: 'Monitor', count: 6, description: 'Windows system tools, debloaters, activation & OS utilities' },
  { name: 'Software', icon: 'FileText', count: 4, description: 'Digital software applications, PC tools & productivity suites' }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name: 'Chris Titus Tech WinUtil (Windows Utility)',
    slug: 'chris-titus-tech-winutil',
    category: 'Windows Tools',
    shortDescription: 'Ultimate Windows optimization tool, debloater, telemetry disabler, and one-click app installer.',
    fullDescription: 'ChrisTitusTech WinUtil is an all-in-one PowerShell-based utility for Windows 10 and 11. It allows users to strip unnecessary Windows bloatware, disable heavy telemetry and tracking, apply recommended system performance tweaks, and install essential software packages cleanly with a single click.\n\nSourced directly from the official GitHub repository (ChrisTitusTech/winutil).',
    price: 0,
    originalPrice: 499,
    discountPercent: 100,
    downloadSize: '2.4 MB',
    version: 'v24.08.01',
    licenseType: 'Lifetime License',
    rating: 4.9,
    reviewCount: 1240,
    image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'One-Click Windows Debloater',
      'Disable Telemetry & Tracking Services',
      'Install Popular Software Packages',
      'Performance & Latency Tweaks',
      'PowerShell Native & Open Source'
    ],
    requirements: ['Windows 10 / 11 (64-bit)', 'PowerShell 5.1+', 'Administrator Privileges'],
    versionHistory: [
      {
        version: 'v24.08.01',
        date: '2026-08-01',
        changes: ['Updated Win11 24H2 tweaks', 'Added new chocolatey & winget packages', 'Improved telemetry script performance']
      }
    ],
    fileUrl: 'https://github.com/ChrisTitusTech/winutil/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: true,
    isFeatured: true,
    isNew: false,
    tags: ['Windows 11', 'Debloater', 'Tweaks', 'PowerShell', 'GitHub'],
    salesCount: 3410
  },
  {
    id: 'prod-002',
    name: 'Microsoft Activation Scripts (MAS)',
    slug: 'microsoft-activation-scripts-mas',
    category: 'Windows Tools',
    shortDescription: 'Open-source Windows & Office activator featuring HWID, KMS38, and Ohook activation methods.',
    fullDescription: 'Microsoft Activation Scripts (MAS) is the premier open-source Windows and Office activation utility. Built with clean CMD & PowerShell scripts without third-party antivirus flags, offering digital license HWID activation for Windows 10/11 and Ohook activation for Office.\n\nSourced directly from the official GitHub repository (massgravel/Microsoft-Activation-Scripts).',
    price: 0,
    originalPrice: 999,
    discountPercent: 100,
    downloadSize: '1.8 MB',
    version: 'v2.6',
    licenseType: 'Perpetual',
    rating: 5.0,
    reviewCount: 2890,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'Permanent Digital License HWID Activation',
      'KMS38 Activation for Enterprise Server OS',
      'Ohook Office Permanent Activation',
      'Clean Open-Source CMD Architecture',
      'Zero Antivirus False Positives'
    ],
    requirements: ['Windows 8.1 / 10 / 11 / Server', 'Internet connection for HWID registration'],
    versionHistory: [
      {
        version: 'v2.6',
        date: '2026-06-15',
        changes: ['Added support for Office 2024 preview', 'HWID method enhancements', 'Cleaner user menu UI']
      }
    ],
    fileUrl: 'https://github.com/massgravel/Microsoft-Activation-Scripts/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: true,
    isFeatured: true,
    tags: ['Windows Activation', 'MAS', 'HWID', 'Office', 'GitHub'],
    salesCount: 5120
  },
  {
    id: 'prod-003',
    name: 'Rufus Bootable USB Creator',
    slug: 'rufus-bootable-usb-creator',
    category: 'Windows Tools',
    shortDescription: 'Fast open-source utility to format and create bootable USB drives with Windows 11 TPM bypass support.',
    fullDescription: 'Rufus is a lightweight and blazing fast utility that formats and creates bootable USB flash drives, such as USB keys/pendrives, memory sticks, etc. Essential for clean Windows installations and bypassing Windows 11 hardware requirements (TPM 2.0, Secure Boot, RAM limits).\n\nSourced directly from the official GitHub repository (pbatard/rufus).',
    price: 0,
    originalPrice: 299,
    discountPercent: 100,
    downloadSize: '1.4 MB',
    version: 'v4.5',
    licenseType: 'Lifetime License',
    rating: 4.9,
    reviewCount: 1850,
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'Bypass Windows 11 TPM 2.0 & Secure Boot',
      'Create Bootable USBs 2x Faster than Competition',
      'Bypass Microsoft Account Online Requirement',
      'Persistent Partition Support for Linux Live USBs',
      'Check Drive Bad Blocks & Bad Sectors'
    ],
    requirements: ['Windows 8 / 10 / 11', '8GB+ USB Flash Drive'],
    versionHistory: [
      {
        version: 'v4.5',
        date: '2026-05-10',
        changes: ['Added Win11 24H2 setup customization options', 'Fixed UEFI bootloader detection', 'Speed optimizations']
      }
    ],
    fileUrl: 'https://github.com/pbatard/rufus/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: false,
    isFeatured: true,
    tags: ['Rufus', 'USB Bootable', 'Windows 11 ISO', 'TPM Bypass', 'GitHub'],
    salesCount: 2980
  },
  {
    id: 'prod-004',
    name: 'Ventoy Multiboot USB Solution',
    slug: 'ventoy-multiboot-usb-solution',
    category: 'Windows Tools',
    shortDescription: 'Innovative open-source multiboot USB tool - simply drag and drop ISO files onto your USB drive.',
    fullDescription: 'Ventoy is an open-source tool to create bootable USB drives for ISO/WIM/IMG/VHD(x)/EFI files. With Ventoy, you don\'t need to format the disk over and over; you just copy ISO files to the USB drive and boot them directly from a customizable menu.\n\nSourced directly from the official GitHub repository (ventoy/Ventoy).',
    price: 0,
    originalPrice: 399,
    discountPercent: 100,
    downloadSize: '15.8 MB',
    version: 'v1.0.99',
    licenseType: 'Lifetime License',
    rating: 4.8,
    reviewCount: 940,
    image: 'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      '100% Open Source Multiboot Creator',
      'Direct Boot from ISO without Extraction',
      'Supports 1100+ Verified ISO Images',
      'x86 Legacy BIOS, IA32 UEFI, x86_64 UEFI Boot',
      'Drag and Drop File Management'
    ],
    requirements: ['Windows or Linux Host', '16GB+ USB Pendrive or External SSD'],
    versionHistory: [
      {
        version: 'v1.0.99',
        date: '2026-07-02',
        changes: ['Support for latest Windows 11 ISO builds', 'Custom theme engine update', 'Bug fixes for NVMe drives']
      }
    ],
    fileUrl: 'https://github.com/ventoy/Ventoy/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: false,
    isFeatured: false,
    tags: ['Ventoy', 'Multiboot', 'ISO Boot', 'Windows', 'GitHub'],
    salesCount: 1670
  },
  {
    id: 'prod-005',
    name: 'BleachBit Disk Cleaner & Privacy Guard',
    slug: 'bleachbit-disk-cleaner-privacy-guard',
    category: 'Windows Tools',
    shortDescription: 'Open-source system cleaner that frees disk space, clears browser cache, and shreds sensitive files.',
    fullDescription: 'BleachBit quickly frees disk space and guards your privacy. It frees cache, deletes cookies, clears Internet history, shreds temporary files, deletes logs, and discards junk you did not know was there. Designed for Windows and Linux.\n\nSourced directly from the official GitHub repository (bleachbit/bleachbit).',
    price: 0,
    originalPrice: 199,
    discountPercent: 100,
    downloadSize: '11.2 MB',
    version: 'v4.6.0',
    licenseType: 'Lifetime License',
    rating: 4.7,
    reviewCount: 620,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'Wipe Free Disk Space to Hide Remnants',
      'Shred Files to Prevent Data Recovery',
      'Clear Browser Caches, Cookies & History',
      'Clean System Registry & Temp Logs',
      'Zero Spyware or Adware Bundles'
    ],
    requirements: ['Windows 7 / 8 / 10 / 11 (32 & 64-bit)'],
    versionHistory: [
      {
        version: 'v4.6.0',
        date: '2026-04-18',
        changes: ['Cleaners for MS Edge, Chrome & Firefox 2026', 'Improved memory cleaning', 'Python 3.12 core engine update']
      }
    ],
    fileUrl: 'https://github.com/bleachbit/bleachbit/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: false,
    isFeatured: false,
    tags: ['BleachBit', 'Disk Cleaner', 'Privacy', 'System Maintenance', 'GitHub'],
    salesCount: 1140
  },
  {
    id: 'prod-006',
    name: 'Files App - Modern Windows Explorer',
    slug: 'files-app-modern-windows-explorer',
    category: 'Software',
    shortDescription: 'Next-generation file manager for Windows featuring tabs, dual pane, cloud sync & modern Fluent UI.',
    fullDescription: 'Files is an open-source file manager designed to modernize your Windows experience. Built with Fluent Design principles, Files features multi-tab browsing, dual-pane layout, rich file tags, integrated archive support, and seamless cloud storage integrations.\n\nSourced directly from the official GitHub repository (files-community/Files).',
    price: 0,
    originalPrice: 799,
    discountPercent: 100,
    downloadSize: '48.5 MB',
    version: 'v3.5.1',
    licenseType: 'Lifetime License',
    rating: 4.9,
    reviewCount: 1420,
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'Fluent Design & Mica Material Themes',
      'Multi-Tab File Browsing & Dual Pane Mode',
      'File Tagging & Color Coding System',
      'Built-in Archive Compression (7z, zip, tar)',
      'Git & Cloud Drive Status Badges'
    ],
    requirements: ['Windows 10 build 19041+ / Windows 11 (64-bit)'],
    versionHistory: [
      {
        version: 'v3.5.1',
        date: '2026-07-20',
        changes: ['Performance rendering speedup', 'Enhanced dark theme contrast', 'Dual pane keyboard shortcuts update']
      }
    ],
    fileUrl: 'https://github.com/files-community/Files/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: true,
    isFeatured: true,
    isNew: true,
    tags: ['Files App', 'File Explorer', 'Fluent UI', 'Windows 11', 'GitHub'],
    salesCount: 2350
  },
  {
    id: 'prod-007',
    name: 'Microsoft PowerToys System Utilities',
    slug: 'microsoft-powertoys-system-utilities',
    category: 'Software',
    shortDescription: 'Set of system utilities for power users to customize and streamline their Windows experience.',
    fullDescription: 'Microsoft PowerToys is a set of utilities for power users to customize and streamline their Windows 10 and 11 experience for greater productivity. Includes FancyZones layout manager, PowerToys Run launcher, Color Picker, Text Extractor (OCR), and Mouse Utilities.\n\nSourced directly from the official GitHub repository (microsoft/PowerToys).',
    price: 0,
    originalPrice: 1299,
    discountPercent: 100,
    downloadSize: '165.2 MB',
    version: 'v0.84.0',
    licenseType: 'Lifetime License',
    rating: 4.9,
    reviewCount: 3150,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'FancyZones Window Layout Customizer',
      'PowerToys Run Quick Launcher (Alt+Space)',
      'Screen Text Extractor OCR Tool',
      'Awake Keep-Alive System Utility',
      'Advanced Batch File Renamer (PowerRename)'
    ],
    requirements: ['Windows 10 v2004 (19041) or Windows 11'],
    versionHistory: [
      {
        version: 'v0.84.0',
        date: '2026-07-28',
        changes: ['New New+ workspace desktop switcher', 'Workspaces utility performance improvements', 'ARM64 compilation fixes']
      }
    ],
    fileUrl: 'https://github.com/microsoft/PowerToys/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: true,
    isFeatured: true,
    tags: ['PowerToys', 'Microsoft', 'Productivity', 'FancyZones', 'GitHub'],
    salesCount: 4890
  },
  {
    id: 'prod-008',
    name: 'ShareX Screen Capture & Automation',
    slug: 'sharex-screen-capture-automation',
    category: 'Software',
    shortDescription: 'Feature-rich open-source screen capture, file sharing, and productivity tool.',
    fullDescription: 'ShareX is a free and open-source program that lets you capture or record any area of your screen and share it with a single press of a key. It also allows uploading images, text or other types of files to over 80 supported destinations.\n\nSourced directly from the official GitHub repository (ShareX/ShareX).',
    price: 0,
    originalPrice: 499,
    discountPercent: 100,
    downloadSize: '14.6 MB',
    version: 'v16.1.0',
    licenseType: 'Lifetime License',
    rating: 4.8,
    reviewCount: 1120,
    image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'Full Screen, Region & Scrolling Screen Capture',
      'Screen Recording (GIF & MP4)',
      'Image Annotations, Watermarks & Blur Effects',
      'OCR Text Recognition from Images',
      'Over 80 Destination Uploaders (Imgur, Drive, S3)'
    ],
    requirements: ['Windows 10 / 11 (64-bit)', '.NET 8 Desktop Runtime'],
    versionHistory: [
      {
        version: 'v16.1.0',
        date: '2026-05-24',
        changes: ['FFmpeg video encoder upgrade', 'Enhanced region capture sniper mode', 'Custom hotkey improvements']
      }
    ],
    fileUrl: 'https://github.com/ShareX/ShareX/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: false,
    isFeatured: false,
    tags: ['ShareX', 'Screen Capture', 'GIF Recorder', 'OCR', 'GitHub'],
    salesCount: 1980
  },
  {
    id: 'prod-009',
    name: 'Nilesoft Shell Context Menu Modifier',
    slug: 'nilesoft-shell-context-menu-modifier',
    category: 'Windows Tools',
    shortDescription: 'Lightweight context menu customizer for Windows 11 that restores legacy speed and options.',
    fullDescription: 'Nilesoft Shell is a lightweight context menu extension that lets you customize the context menu of Windows File Explorer. It provides a sleek, modern UI, fast response, and custom cascading menus with full control over Windows 11 context menus.\n\nSourced directly from official GitHub repository (m417z/nilesoft-shell).',
    price: 0,
    originalPrice: 249,
    discountPercent: 100,
    downloadSize: '3.2 MB',
    version: 'v1.9.2',
    licenseType: 'Lifetime License',
    rating: 4.9,
    reviewCount: 540,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      'Bypass Windows 11 "Show More Options" Delay',
      'Fully Custom Cascading Right-Click Menus',
      'High Performance C++ Architecture',
      'Per-Extension & File Type Context Customizer',
      'Dark Mode & Acrylic Blur Glassmorphism'
    ],
    requirements: ['Windows 10 / 11 (64-bit)'],
    versionHistory: [
      {
        version: 'v1.9.2',
        date: '2026-06-12',
        changes: ['Windows 11 24H2 context menu hook compatibility', 'New syntax options for shell configs']
      }
    ],
    fileUrl: 'https://github.com/m417z/nilesoft-shell/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: false,
    isFeatured: false,
    isNew: true,
    tags: ['Nilesoft Shell', 'Windows 11', 'Context Menu', 'Customizer', 'GitHub'],
    salesCount: 870
  },
  {
    id: 'prod-010',
    name: '7-Zip High-Compression Archiver',
    slug: '7-zip-high-compression-archiver',
    category: 'Software',
    shortDescription: 'Open-source file archiver featuring high compression 7z format and AES-256 encryption.',
    fullDescription: '7-Zip is a file archiver with a high compression ratio. It supports high compression 7z format with LZMA and LZMA2 compression, strong AES-256 encryption, self-extracting capability, and integration with Windows Shell.\n\nSourced directly from official GitHub releases (ip7z/7zip).',
    price: 0,
    originalPrice: 199,
    discountPercent: 100,
    downloadSize: '1.6 MB',
    version: 'v24.07',
    licenseType: 'Perpetual',
    rating: 4.9,
    reviewCount: 4120,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    screenshots: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80'
    ],
    features: [
      '7z Format LZMA/LZMA2 High Compression',
      'AES-256 Encryption for Zip and 7z Formats',
      'Unpack 30+ Formats (RAR, ISO, TAR, GZ, CAB)',
      'Windows Shell Integration & Context Menu',
      'Command Line Version & Plugin for FAR Manager'
    ],
    requirements: ['Windows 7 / 8 / 10 / 11 / Server'],
    versionHistory: [
      {
        version: 'v24.07',
        date: '2026-06-01',
        changes: ['New Zstandard compression options', 'ARM64 speedup', 'Security patches for extraction']
      }
    ],
    fileUrl: 'https://github.com/ip7z/7zip/releases/latest',
    instantKeyAvailable: true,
    isBestSeller: true,
    isFeatured: false,
    tags: ['7-Zip', 'Archiver', 'Compression', '7z', 'GitHub'],
    salesCount: 6740
  }
];

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
  { id: 'cpn-1', code: 'OMOVE15', discountType: 'percentage', discountValue: 15, minOrderAmount: 0, description: '15% OFF on all orders & services', isActive: true, usageCount: 42 },
  { id: 'cpn-2', code: 'PROMO50', discountType: 'fixed', discountValue: 50, minOrderAmount: 99, description: 'Flat ₹50 Instant Discount', isActive: true, usageCount: 18 },
  { id: 'cpn-3', code: 'ASHIK20', discountType: 'percentage', discountValue: 20, minOrderAmount: 199, description: 'VIP 20% OFF Special Code', isActive: true, usageCount: 9 }
];
