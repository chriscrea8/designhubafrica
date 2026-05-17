export const mockDesigners = [
  { id: "d1", user: { firstName: "Kwame", lastName: "Mensah", location: "Accra, Ghana", isVerified: true }, specialties: ["African Fusion", "Modern"], avgRating: 4.9, hourlyRate: 15000, currency: "GHS", responseTime: "Within 2 hours", isAvailable: true },
  { id: "d2", user: { firstName: "Zara", lastName: "Ibrahim", location: "Nairobi, Kenya", isVerified: true }, specialties: ["Minimalist", "Scandinavian"], avgRating: 4.7, hourlyRate: 8000, currency: "KES", responseTime: "Within 6 hours", isAvailable: true },
  { id: "d3", user: { firstName: "Chidi", lastName: "Eze", location: "Lagos, Nigeria", isVerified: true }, specialties: ["Contemporary", "Industrial"], avgRating: 4.6, hourlyRate: 50000, currency: "NGN", responseTime: "Within 3 hours", isAvailable: true },
  { id: "d4", user: { firstName: "Amara", lastName: "Diallo", location: "Dakar, Senegal", isVerified: true }, specialties: ["Bohemian", "Traditional"], avgRating: 4.8, hourlyRate: 75000, currency: "XOF", responseTime: "Within 4 hours", isAvailable: true },
];

export const mockProjects = [
  { id: "p1", title: "Lekki Penthouse Redesign", description: "Complete interior redesign of a 3-bedroom penthouse.", status: "IN_PROGRESS", roomType: "Full Home", style: "African Fusion", budgetMin: 5000000, budgetMax: 12000000, currency: "NGN", progress: 65, location: "Lagos", createdAt: "2025-01-10" },
  { id: "p2", title: "Westlands Office Space", description: "Modern co-working space design.", status: "REVIEW", roomType: "Commercial", style: "Minimalist", budgetMin: 3000000, budgetMax: 8000000, currency: "KES", progress: 90, location: "Nairobi", createdAt: "2025-01-20" },
  { id: "p3", title: "Victoria Island Restaurant", description: "Upscale Afro-contemporary restaurant.", status: "OPEN", roomType: "Commercial", style: "Contemporary", budgetMin: 15000000, budgetMax: 25000000, currency: "NGN", progress: 0, location: "Lagos", createdAt: "2025-03-01" },
];

export const mockProducts = [
  { id: "prod1", name: "Adinkra Coffee Table", category: "Furniture", price: 450000, currency: "NGN", material: "Solid Mahogany", inStock: true },
  { id: "prod2", name: "Kente Throw Pillow Set", category: "Textiles", price: 85000, currency: "NGN", material: "Premium Cotton", inStock: true },
  { id: "prod3", name: "Savanna Pendant Light", category: "Lighting", price: 120000, currency: "NGN", material: "Natural Rattan", inStock: true },
  { id: "prod4", name: "Maasai Beaded Wall Art", category: "Art & Decor", price: 280000, currency: "NGN", material: "Glass Beads", inStock: true },
  { id: "prod5", name: "Ndebele Pattern Rug", category: "Rugs & Carpets", price: 380000, currency: "NGN", material: "100% Wool", inStock: true },
  { id: "prod6", name: "Zulu Basket Planter Set", category: "Plants", price: 65000, currency: "NGN", material: "Ilala Palm", inStock: true },
];

export const mockInspirationItems = [
  { id: "i1", title: "Serene Savanna Living Room", category: "Living Room", style: "African Fusion", designerName: "Kwame Mensah", likes: 342 },
  { id: "i2", title: "Minimalist Nairobi Bedroom", category: "Bedroom", style: "Minimalist", designerName: "Zara Ibrahim", likes: 256 },
  { id: "i3", title: "Coastal Kitchen Paradise", category: "Kitchen", style: "Contemporary", designerName: "Amara Diallo", likes: 189 },
  { id: "i4", title: "Industrial Loft Workspace", category: "Office", style: "Industrial", designerName: "Chidi Eze", likes: 421 },
  { id: "i5", title: "Tropical Courtyard Oasis", category: "Outdoor", style: "Tropical", designerName: "Kwame Mensah", likes: 198 },
  { id: "i6", title: "Art Deco Dining Room", category: "Dining Room", style: "Art Deco", designerName: "Chidi Eze", likes: 315 },
];

export const mockRevenueData = [{ label: "Jan", value: 2400000 }, { label: "Feb", value: 3100000 }, { label: "Mar", value: 2800000 }, { label: "Apr", value: 3500000 }, { label: "May", value: 4200000 }, { label: "Jun", value: 3900000 }];
export const mockUserGrowthData = [{ label: "Jan", value: 120 }, { label: "Feb", value: 185 }, { label: "Mar", value: 240 }, { label: "Apr", value: 310 }, { label: "May", value: 420 }, { label: "Jun", value: 530 }];
