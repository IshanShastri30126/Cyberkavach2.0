import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding CyberKavach 2.0 database...\n");

  const password = await bcrypt.hash("password123", 10);

  // ─── Seed Users ────────────────────────────────────────────
  const seedUsers = [
    { name: "Dr. Sharma (Faculty)", email: "faculty@cyberkavach.com", role: "FACULTY" as Role },
    { name: "Aarav Patel (SC)", email: "sc@cyberkavach.com", role: "STUDENT_COORDINATOR" as Role },
    { name: "Priya Verma (Tech)", email: "tech@cyberkavach.com", role: "TECH" as Role },
    { name: "Riya Singh (Content)", email: "content@cyberkavach.com", role: "CONTENT" as Role },
    { name: "Karan Mehta (Social)", email: "social@cyberkavach.com", role: "SOCIAL_MEDIA" as Role },
    { name: "Ananya Gupta (Member)", email: "member@cyberkavach.com", role: "MEMBER" as Role },
    { name: "Guest User", email: "guest@cyberkavach.com", role: "GUEST" as Role },
  ];

  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: password },
      create: { name: u.name, email: u.email, passwordHash: password, role: u.role, isApproved: true, isActive: true },
    });
    console.log(`  ✅ ${u.role}: ${u.email}`);
  }

  // ─── Seed Badges ──────────────────────────────────────────
  const badges = [
    { name: "Bronze Star", description: "Earned 50 appreciation points", icon: "🥉", pointThreshold: 50 },
    { name: "Silver Star", description: "Earned 150 appreciation points", icon: "🥈", pointThreshold: 150 },
    { name: "Gold Star", description: "Earned 300 appreciation points", icon: "🥇", pointThreshold: 300 },
    { name: "Platinum Star", description: "Earned 500 appreciation points", icon: "💎", pointThreshold: 500 },
    { name: "Diamond Legend", description: "Earned 1000 appreciation points", icon: "👑", pointThreshold: 1000 },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b,
    });
    console.log(`  🏅 Badge: ${b.name} (${b.pointThreshold} pts)`);
  }

  // ─── Seed Club Settings ────────────────────────────────────
  const settings = [
    { key: "academic_year", value: { year: "2025-2026", semester: "Spring" } },
    { key: "escalation_threshold_hours", value: { hours: 48 } },
    { key: "event_categories", value: { categories: ["Workshop", "Hackathon", "Seminar", "Competition", "Social", "Technical", "Other"] } },
    { key: "point_policies", value: { maxPerEvent: 50, deductionRequiresReason: true } },
  ];

  for (const s of settings) {
    await prisma.clubSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
    console.log(`  ⚙️  Setting: ${s.key}`);
  }

  console.log("\n🎉 Seed complete! All demo accounts use password: password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
