import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding DesignHub Africa...\n");

  // Clear all tables
  console.log("Clearing existing data...");
  const tables = ["auditLog","messageModeration","userStrike","userSuspension","clientDesignerRelationship","platformTransaction","notification","message","conversationParticipant","conversation","escrowTransaction","escrowAccount","dispute","projectFile","projectTask","proposal","milestone","contract","project","review","orderItem","order","product","productCategory","promotion","trustScore","subscription","designerVerification","vendorVerification","portfolioItem","servicePackage","earning","savedDesigner","artisanProfile","designerProfile","vendorProfile","userAdminAssignment","adminRoleConfig","session","account","verificationToken","user"];
  for (const t of tables) { try { await (prisma as any)[t].deleteMany(); } catch {} }
  console.log("Cleared!\n");

  const pw = await hash("password123", 12);

  // Users
  console.log("Creating users...");
  const admin = await prisma.user.create({ data: { firstName: "Admin", lastName: "User", email: "admin@designhub.africa", password: pw, referralCode: "DH-ADM001", role: "ADMIN", adminRole: "SUPER_ADMIN", isVerified: true, location: "Lagos, Nigeria" } });
  const client1 = await prisma.user.create({ data: { firstName: "Adaeze", lastName: "Okafor", email: "adaeze@designhub.africa", password: pw, role: "CLIENT", referralCode: "DH-ADA001", isVerified: true, location: "Lagos, Nigeria", bio: "Homeowner looking to redesign my apartment." } });
  const client2 = await prisma.user.create({ data: { firstName: "David", lastName: "Afolabi", email: "david@designhub.africa", password: pw, role: "CLIENT", referralCode: "DH-DAV001", isVerified: true, location: "Abuja, Nigeria" } });
  const d1 = await prisma.user.create({ data: { firstName: "Kwame", lastName: "Mensah", email: "kwame@designhub.africa", password: pw, role: "DESIGNER", referralCode: "DH-KWA001", isVerified: true, location: "Accra, Ghana" } });
  const d2 = await prisma.user.create({ data: { firstName: "Zara", lastName: "Ibrahim", email: "zara@designhub.africa", password: pw, role: "DESIGNER", referralCode: "DH-ZAR001", isVerified: true, location: "Nairobi, Kenya" } });
  const art1 = await prisma.user.create({ data: { firstName: "Emeka", lastName: "Nwosu", email: "emeka@designhub.africa", password: pw, role: "ARTISAN", referralCode: "DH-EME001", isVerified: true, location: "Lagos, Nigeria" } });
  const art2 = await prisma.user.create({ data: { firstName: "Kofi", lastName: "Asante", email: "kofi@designhub.africa", password: pw, role: "ARTISAN", referralCode: "DH-KOF001", isVerified: true, location: "Kumasi, Ghana" } });
  const vendor = await prisma.user.create({ data: { firstName: "Tendai", lastName: "Moyo", email: "tendai@designhub.africa", password: pw, role: "VENDOR", referralCode: "DH-TEN001", isVerified: true, location: "Harare, Zimbabwe" } });

  // Designer profiles
  console.log("Creating profiles...");
  const dp1 = await prisma.designerProfile.create({ data: { userId: d1.id, specialties: ["African Fusion", "Modern", "Contemporary"], hourlyRate: 15000, currency: "GHS", yearsExperience: 12, certifications: ["BIID", "SBID"], languages: ["English", "Twi"], designTools: ["SketchUp", "AutoCAD", "3ds Max"], isAvailable: true, responseTime: "Within 2 hours", approvalStatus: "APPROVED", verificationLevel: "PREMIUM", approvedAt: new Date(), avgRating: 4.9, totalReviews: 127, completionRate: 0.96 } });
  const dp2 = await prisma.designerProfile.create({ data: { userId: d2.id, specialties: ["Minimalist", "Scandinavian"], hourlyRate: 8000, currency: "KES", yearsExperience: 6, certifications: ["KIA"], languages: ["English", "Swahili"], designTools: ["3ds Max", "Revit"], isAvailable: true, responseTime: "Within 6 hours", approvalStatus: "APPROVED", verificationLevel: "BASIC", approvedAt: new Date(), avgRating: 4.7, totalReviews: 68, completionRate: 0.91 } });

  // Artisan profiles
  console.log("Creating artisan profiles...");
  await prisma.artisanProfile.create({ data: { userId: art1.id, serviceCategory: "carpenter", specialties: ["Custom Furniture", "Kitchen Cabinets", "Wardrobes"], hourlyRate: 8000, currency: "NGN", yearsExperience: 15, certifications: ["NABTEB"], languages: ["English", "Igbo"], tools: ["Table Saw", "Router", "CNC"], workLocations: ["Lagos", "Ibadan", "Abuja"], approvalStatus: "APPROVED", approvedAt: new Date(), avgRating: 4.8, totalReviews: 89, completionRate: 0.94, bio: "Master carpenter specializing in bespoke furniture and fitted kitchens." } });
  await prisma.artisanProfile.create({ data: { userId: art2.id, serviceCategory: "painter", specialties: ["Decorative Painting", "Wall Textures", "Murals"], hourlyRate: 5000, currency: "GHS", yearsExperience: 8, certifications: [], languages: ["English", "Twi"], tools: ["Spray Gun", "Roller Set"], workLocations: ["Accra", "Kumasi", "Takoradi"], approvalStatus: "APPROVED", approvedAt: new Date(), avgRating: 4.6, totalReviews: 42, completionRate: 0.92, bio: "Professional painter and decorator with expertise in wall textures." } });

  // Portfolios — Kwame needs 5+ for verification
  for (const item of [
    { designerId: dp1.id, title: "Accra Villa Living Room", category: "Living Room", style: "African Fusion", location: "Accra, Ghana" },
    { designerId: dp1.id, title: "Lagos Penthouse Master Bedroom", category: "Bedroom", style: "Modern", location: "Lagos, Nigeria" },
    { designerId: dp1.id, title: "Kumasi Restaurant Interior", category: "Commercial", style: "Contemporary", location: "Kumasi, Ghana" },
    { designerId: dp1.id, title: "Abuja Executive Office", category: "Office", style: "Modern", location: "Abuja, Nigeria" },
    { designerId: dp1.id, title: "Lekki Beach House Kitchen", category: "Kitchen", style: "African Fusion", location: "Lagos, Nigeria" },
    { designerId: dp1.id, title: "Cape Coast Hotel Lobby", category: "Commercial", style: "Contemporary", location: "Cape Coast, Ghana" },
    { designerId: dp2.id, title: "Nairobi Loft Apartment", category: "Full Home", style: "Minimalist", location: "Nairobi, Kenya" },
    { designerId: dp2.id, title: "Mombasa Beach House", category: "Living Room", style: "Scandinavian", location: "Mombasa, Kenya" },
    { designerId: dp2.id, title: "Karen Garden Villa", category: "Outdoor", style: "Minimalist", location: "Nairobi, Kenya" },
    { designerId: dp2.id, title: "Westlands Co-Working Space", category: "Commercial", style: "Scandinavian", location: "Nairobi, Kenya" },
    { designerId: dp2.id, title: "Kilimani Studio Apartment", category: "Full Home", style: "Minimalist", location: "Nairobi, Kenya" },
  ]) await prisma.portfolioItem.create({ data: { ...item, description: `A beautiful ${item.style.toLowerCase()} ${item.category.toLowerCase()} project completed in ${item.location}.`, images: [], isFeatured: true } });

  // Service packages
  for (const pkg of [
    { designerId: dp1.id, title: "Room Refresh", description: "Quick redesign of a single room.", price: 500000, deliveryDays: 14 },
    { designerId: dp1.id, title: "Full Room Design", description: "Complete room transformation with 3D renders.", price: 1500000, deliveryDays: 30 },
    { designerId: dp2.id, title: "Consultation", description: "2-hour design consultation.", price: 200000, deliveryDays: 7 },
  ]) await prisma.servicePackage.create({ data: { ...pkg, currency: "NGN" } });

  // Vendor + products
  console.log("Creating vendor & products...");
  const vp = await prisma.vendorProfile.create({ data: { userId: vendor.id, storeName: "Tendai's Woodworks", storeDescription: "Handcrafted furniture from sustainable African hardwoods.", category: "Furniture", approvalStatus: "APPROVED", approvedAt: new Date(), avgRating: 4.8, totalReviews: 45 } });

  for (const cat of [
    { name: "Furniture", slug: "furniture", icon: "🪑" }, { name: "Lighting", slug: "lighting", icon: "💡" },
    { name: "Textiles", slug: "textiles", icon: "🧵" }, { name: "Wall Decor", slug: "wall-decor", icon: "🎨" },
    { name: "Rugs & Carpets", slug: "rugs-carpets", icon: "🟫" }, { name: "Building Materials", slug: "building-materials", icon: "🧱" },
    { name: "Paint", slug: "paint", icon: "🖌️" }, { name: "Kitchen Fittings", slug: "kitchen-fittings", icon: "🍳" },
    { name: "Bathroom Fittings", slug: "bathroom-fittings", icon: "🚿" },
  ]) await prisma.productCategory.create({ data: cat });

  for (const p of [
    { name: "Adinkra Coffee Table", category: "Furniture", price: 450000, material: "Mahogany", stockCount: 5, deliveryMethod: "both", shippingCost: 15000, estimatedDeliveryDays: 7 },
    { name: "Kente Throw Pillow Set", category: "Textiles", price: 85000, material: "Cotton", stockCount: 42, deliveryMethod: "delivery", shippingCost: 5000, estimatedDeliveryDays: 3 },
    { name: "Savanna Pendant Light", category: "Lighting", price: 120000, material: "Rattan", stockCount: 18, deliveryMethod: "both", shippingCost: 8000, estimatedDeliveryDays: 5 },
    { name: "Maasai Beaded Wall Art", category: "Wall Decor", price: 280000, material: "Glass Beads", stockCount: 8, deliveryMethod: "delivery", shippingCost: 10000, estimatedDeliveryDays: 5 },
    { name: "Ndebele Area Rug", category: "Rugs & Carpets", price: 380000, material: "100% Wool", stockCount: 12, deliveryMethod: "delivery", shippingCost: 12000, estimatedDeliveryDays: 7 },
    { name: "Zulu Basket Planter Set", category: "Furniture", price: 65000, material: "Ilala Palm", stockCount: 35, deliveryMethod: "pickup", shippingCost: 0, estimatedDeliveryDays: 1 },
  ]) await prisma.product.create({ data: { vendorId: vp.id, name: p.name, description: `Handcrafted ${p.name.toLowerCase()} from Africa.`, price: p.price, category: p.category, material: p.material, stockCount: p.stockCount, inStock: true, images: [], moderationStatus: "APPROVED", isApproved: true, tags: ["handmade", "african"], deliveryMethod: p.deliveryMethod, shippingCost: p.shippingCost, estimatedDeliveryDays: p.estimatedDeliveryDays } });

  // Projects with milestones
  console.log("Creating projects + milestones...");
  const proj1 = await prisma.project.create({ data: { title: "Lekki Penthouse Redesign", description: "Complete interior redesign of a 3-bedroom penthouse in Lekki Phase 1. Looking for African Fusion style with sustainable materials. Need living room, master bedroom, guest room, kitchen and dining area designed.", clientId: client1.id, designerId: dp1.id, status: "IN_PROGRESS", roomType: "Full Home", style: "African Fusion", budgetMin: 5000000, budgetMax: 12000000, progress: 65, location: "Lagos, Nigeria", urgency: "medium" } });

  const proj2 = await prisma.project.create({ data: { title: "Abuja Villa Kitchen Renovation", description: "Modern kitchen renovation for a 5-bedroom villa in Maitama. Need minimalist design with high-end appliances integration.", clientId: client2.id, designerId: dp2.id, status: "REVIEW", roomType: "Kitchen", style: "Minimalist", budgetMin: 3000000, budgetMax: 6000000, progress: 90, location: "Abuja, Nigeria", urgency: "low" } });

  const proj3 = await prisma.project.create({ data: { title: "V.I. Restaurant Interior", description: "Upscale Afro-contemporary restaurant design on Victoria Island. 200 sqm space, needs dining area, bar, lounge, and outdoor terrace design.", clientId: client2.id, status: "OPEN", roomType: "Commercial", style: "Contemporary", budgetMin: 15000000, budgetMax: 25000000, progress: 0, location: "Lagos, Nigeria", urgency: "high" } });

  // Milestones for proj1
  await prisma.milestone.create({ data: { projectId: proj1.id, title: "Concept & Mood Board", description: "Initial design concepts, mood boards, and material palette for all rooms.", amount: 1500000, status: "paid", paidAt: new Date("2025-02-15") } });
  await prisma.milestone.create({ data: { projectId: proj1.id, title: "3D Visualization", description: "Photorealistic 3D renders of living room, master bedroom, and kitchen.", amount: 2000000, status: "in_progress" } });
  await prisma.milestone.create({ data: { projectId: proj1.id, title: "Material Sourcing & Procurement", description: "Source all furniture, fixtures, and materials. Coordinate with vendors.", amount: 3000000, status: "pending" } });
  await prisma.milestone.create({ data: { projectId: proj1.id, title: "Execution & Final Styling", description: "On-site execution, furniture placement, and final styling.", amount: 5500000, status: "pending" } });

  // Milestones for proj2
  await prisma.milestone.create({ data: { projectId: proj2.id, title: "Kitchen Layout Design", description: "Optimized kitchen layout with appliance placement.", amount: 800000, status: "paid", paidAt: new Date("2025-02-20") } });
  await prisma.milestone.create({ data: { projectId: proj2.id, title: "3D Renders", description: "3D visualization of the final kitchen design.", amount: 600000, status: "paid", paidAt: new Date("2025-03-05") } });
  await prisma.milestone.create({ data: { projectId: proj2.id, title: "Installation Supervision", description: "On-site supervision during kitchen installation.", amount: 1600000, status: "completed", completedAt: new Date() } });

  // Escrow for proj1
  const escrow = await prisma.escrowAccount.create({ data: { projectId: proj1.id, userId: client1.id, balance: 3500000 } });
  await prisma.escrowTransaction.create({ data: { escrowAccountId: escrow.id, amount: 1500000, type: "DEPOSIT", status: "RELEASED", description: "Concept & Mood Board payment", processedAt: new Date("2025-02-15") } });
  await prisma.escrowTransaction.create({ data: { escrowAccountId: escrow.id, amount: 2000000, type: "DEPOSIT", status: "HELD", description: "3D Visualization deposit" } });
  await prisma.escrowTransaction.create({ data: { escrowAccountId: escrow.id, amount: 3000000, type: "DEPOSIT", status: "HELD", description: "Material Sourcing deposit" } });

  // Proposal for open project
  await prisma.proposal.create({ data: { projectId: proj3.id, designerId: dp1.id, coverLetter: "I would love to work on this restaurant project. My experience with African Fusion commercial spaces makes me an ideal fit. I have completed 3 restaurant projects in the past year.", proposedRate: 18000000, deliveryDays: 60, status: "pending" } });

  // Earnings
  await prisma.earning.create({ data: { designerId: dp1.id, amount: 1425000, type: "milestone_payment", description: "Concept & Mood Board — Lekki Penthouse", status: "available" } });

  // Reviews
  await prisma.review.create({ data: { authorId: client1.id, designerId: dp1.id, targetUserId: d1.id, rating: 5, comment: "Kwame transformed our home. His attention to detail and use of African art is phenomenal.", qualityRating: 5, communicationRating: 5, timelinessRating: 4, professionalismRating: 5 } });
  await prisma.review.create({ data: { authorId: client2.id, designerId: dp2.id, targetUserId: d2.id, rating: 5, comment: "Zara brought such peace to our space. Every piece was thoughtfully chosen.", qualityRating: 5, communicationRating: 4, timelinessRating: 5, professionalismRating: 5 } });

  // Conversation + messages
  const conv = await prisma.conversation.create({ data: { projectId: proj1.id, participants: { create: [{ userId: client1.id }, { userId: d1.id }] } } });
  await prisma.message.create({ data: { conversationId: conv.id, senderId: client1.id, content: "Hi Kwame! How is the penthouse project coming along?" } });
  await prisma.message.create({ data: { conversationId: conv.id, senderId: d1.id, content: "Great progress! I have uploaded the revised 3D renders for the living room. Take a look!" } });
  await prisma.message.create({ data: { conversationId: conv.id, senderId: client1.id, content: "These look amazing! Love the color palette. Can we discuss the kitchen next?" } });
  await prisma.message.create({ data: { conversationId: conv.id, senderId: d1.id, content: "Absolutely! I have some stunning ideas for the kitchen island. Let me prepare some concepts." } });

  // Notifications
  await prisma.notification.create({ data: { userId: client1.id, type: "project_update", title: "3D Renders Ready", message: "Kwame has uploaded new 3D renders for your Lekki Penthouse project.", link: "/projects" } });
  await prisma.notification.create({ data: { userId: d1.id, type: "new_message", title: "New Message from Adaeze", message: "Adaeze sent you a message about the Lekki Penthouse.", link: "/client-messages" } });
  await prisma.notification.create({ data: { userId: client1.id, type: "system", title: "New Proposal Received", message: "Kwame Mensah submitted a proposal for V.I. Restaurant Interior.", link: "/projects" } });

  // Platform transactions
  await prisma.platformTransaction.create({ data: { type: "PROJECT_COMMISSION", amount: 75000, referenceId: proj1.id, description: "Commission: Concept & Mood Board" } });

  // MORE OPEN PROJECTS — so designers see jobs in Find Projects
  console.log("Creating open projects for job board...");
  await prisma.project.create({ data: { title: "Ikoyi Duplex Full Renovation", description: "Complete interior renovation of a 4-bedroom duplex in Ikoyi. Need modern African fusion style. Budget includes furniture procurement. Must have experience with luxury residential projects.", clientId: client1.id, status: "OPEN", roomType: "Full Home", style: "African Fusion", budgetMin: 8000000, budgetMax: 20000000, location: "Ikoyi, Lagos", urgency: "medium" } });
  await prisma.project.create({ data: { title: "Co-Working Space Design — Yaba", description: "Design a 500sqm co-working space in Yaba tech hub. Need open plan areas, private offices, meeting rooms, and a cafe corner. Industrial-modern aesthetic.", clientId: client2.id, status: "OPEN", roomType: "Commercial", style: "Industrial", budgetMin: 12000000, budgetMax: 25000000, location: "Yaba, Lagos", urgency: "high" } });
  await prisma.project.create({ data: { title: "Minimalist Bedroom Makeover", description: "Simple bedroom redesign for a 1-bedroom apartment. Looking for Scandinavian minimalist style with neutral tones. Need mood board, 3D render, and shopping list.", clientId: client1.id, status: "OPEN", roomType: "Bedroom", style: "Minimalist", budgetMin: 500000, budgetMax: 1500000, location: "Lekki, Lagos", urgency: "low" } });
  await prisma.project.create({ data: { title: "Boutique Hotel Lobby — Abuja", description: "Design the lobby and reception area of a 30-room boutique hotel in Wuse 2. Art deco theme with local art installations. Need 3D visualization and furniture specifications.", clientId: client2.id, status: "OPEN", roomType: "Commercial", style: "Art Deco", budgetMin: 15000000, budgetMax: 35000000, location: "Wuse 2, Abuja", urgency: "medium" } });
  await prisma.project.create({ data: { title: "Kitchen Remodel — Victoria Island", description: "Modern kitchen renovation with island setup. Need designer to handle layout, cabinet design, appliance selection, and lighting. Italian minimalist influence.", clientId: client1.id, status: "OPEN", roomType: "Kitchen", style: "Contemporary", budgetMin: 3000000, budgetMax: 7000000, location: "V.I., Lagos", urgency: "high" } });
  await prisma.project.create({ data: { title: "Penthouse Outdoor Terrace", description: "Design an outdoor terrace and rooftop lounge for a penthouse apartment. Tropical theme with lounge seating, plants, and ambient lighting.", clientId: client2.id, status: "OPEN", roomType: "Outdoor", style: "Bohemian", budgetMin: 4000000, budgetMax: 10000000, location: "Banana Island, Lagos", urgency: "low" } });

  // RBAC roles
  for (const role of [
    { name: "SUPER_ADMIN", label: "Super Admin", permissions: ["ALL"], isSystem: true },
    { name: "FINANCE_ADMIN", label: "Finance Admin", permissions: ["ESCROW_VIEW", "ESCROW_OVERRIDE", "PAYOUTS_APPROVE"], isSystem: true },
    { name: "MODERATOR", label: "Moderator", permissions: ["PRODUCTS_REVIEW", "PRODUCTS_APPROVE", "MESSAGES_MODERATE"], isSystem: true },
    { name: "KYC_REVIEWER", label: "KYC Reviewer", permissions: ["KYC_REVIEW_DESIGNERS", "KYC_REVIEW_VENDORS", "KYC_APPROVE"], isSystem: true },
    { name: "DISPUTE_MANAGER", label: "Dispute Manager", permissions: ["DISPUTES_VIEW", "DISPUTES_RESOLVE", "ESCROW_VIEW"], isSystem: true },
  ]) await prisma.adminRoleConfig.create({ data: role });

  console.log("\n✅ Seed complete! Test accounts:");
  console.log("  admin@designhub.africa / password123 (Admin)");
  console.log("  adaeze@designhub.africa / password123 (Client)");
  console.log("  david@designhub.africa / password123 (Client)");
  console.log("  kwame@designhub.africa / password123 (Designer)");
  console.log("  zara@designhub.africa / password123 (Designer)");
  console.log("  emeka@designhub.africa / password123 (Artisan - Carpenter)");
  console.log("  kofi@designhub.africa / password123 (Artisan - Painter)");
  console.log("  tendai@designhub.africa / password123 (Vendor)");
}

main().catch(e => { console.error("Seed error:", e); process.exit(1); }).finally(() => prisma.$disconnect());
